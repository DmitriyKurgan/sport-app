import { DailyActivityLevel, StressLevel } from '../../profile/enums';
import { getExercisesPerDay, getRepRange, PhaseConfig } from '../constants';
import { DayPatternMap } from '../constants/splits';
import { isCompoundByPatterns } from '../constants/compound-slugs';
import { ExerciseRole, MovementPattern, ProgramPhase } from '../enums';
import {
  ExerciseCatalogItem,
  GeneratedDay,
  GeneratedExercise,
  ProfileConfig,
} from '../interfaces';
import { selectExercisesForPatterns } from './exercise-selector';

export interface DayGenerationContext {
  dayNumber: number;
  splitDay: DayPatternMap;
  profile: ProfileConfig;
  catalog: ExerciseCatalogItem[];
  phase: PhaseConfig;
  weekNumber: number;
  /** Main lifts, зафиксированные на мезоцикл: pattern → exercise. */
  mainLifts: Map<MovementPattern, ExerciseCatalogItem>;
  /** Для ротации аксессуаров — seed, основанный на weekNumber. */
  accessoryRotationSeed: number;
  bodyweightOnly?: boolean;
}

/**
 * Генерация одного тренировочного дня.
 *
 * Порядок:
 *   1. Разделить patterns на main_lift (первые 1-2 compound паттерна) и accessory (остальные)
 *   2. Для main_lift взять из mainLifts (стабильно на мезоцикл)
 *   3. Для accessory подобрать через selectExercisesForPatterns (с exclude main)
 *   4. Ограничить общее число упражнений по sessionDurationMinutes
 *   5. Рассчитать параметры подходов из REP_RANGES[goal] × phase.volumeModifier
 *   6. Lifestyle adjustments (sleep < 6 или stress high → volume 0.9x, RIR +1; sedentary + неделя 1 → без accessories)
 */
export function generateDay(ctx: DayGenerationContext): GeneratedDay {
  const { splitDay, profile, catalog, phase, weekNumber, mainLifts, bodyweightOnly } = ctx;

  const maxExercises = getExercisesPerDay(profile.sessionDurationMinutes);

  // 1. Выделить main-lift паттерны (compound)
  const mainPatterns: MovementPattern[] = splitDay.patterns.filter(
    (p) => p !== MovementPattern.ISOLATION,
  );
  const accessoryPatterns: MovementPattern[] = splitDay.patterns.filter(
    (p) => p === MovementPattern.ISOLATION,
  );

  const usedSlugs = new Set<string>();
  const exercises: GeneratedExercise[] = [];
  let order = 1;

  // 2. Main lifts: первые 2 compound паттерна или все если их меньше
  const mainPatternSlice = mainPatterns.slice(0, 2);
  for (const pattern of mainPatternSlice) {
    const main = mainLifts.get(pattern);
    if (!main || usedSlugs.has(main.slug)) continue;
    exercises.push(
      buildExercise(main, ExerciseRole.MAIN_LIFT, order++, ctx),
    );
    usedSlugs.add(main.slug);
  }

  // 3. Lifestyle adjustment: sedentary + week 1 → без accessories
  const skipAccessories =
    profile.dailyActivityLevel === DailyActivityLevel.SEDENTARY && weekNumber === 1;

  if (!skipAccessories) {
    // Остальные main-паттерны (3-й, 4-й) как accessory-compound
    const remainingMain = mainPatterns.slice(2);
    const accessoryTargetPatterns = [...remainingMain, ...accessoryPatterns];

    const selections = selectExercisesForPatterns({
      patterns: accessoryTargetPatterns,
      catalog,
      profile,
      role: ExerciseRole.ACCESSORY,
      excludeSlugs: usedSlugs,
      bodyweightOnly,
    });

    // Ротация аксессуаров: сдвигаем выбор через seed
    const rotated = rotateForVariety(selections.map((s) => s.exercise), ctx.accessoryRotationSeed);

    for (const ex of rotated) {
      if (exercises.length >= maxExercises) break;
      if (usedSlugs.has(ex.slug)) continue;
      exercises.push(buildExercise(ex, ExerciseRole.ACCESSORY, order++, ctx));
      usedSlugs.add(ex.slug);
    }
  }

  return {
    dayNumber: ctx.dayNumber,
    name: splitDay.name,
    splitTag: splitDay.splitTag,
    targetPatterns: splitDay.patterns,
    isRestDay: false,
    exercises,
  };
}

/**
 * Ротация: при разных seed'ах возвращает массив в разном порядке,
 * что приводит к выбору разных аксессуаров на разные недели.
 */
function rotateForVariety<T>(items: T[], seed: number): T[] {
  if (items.length <= 1) return items;
  const offset = ((seed % items.length) + items.length) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function buildExercise(
  ex: ExerciseCatalogItem,
  role: ExerciseRole,
  orderIndex: number,
  ctx: DayGenerationContext,
): GeneratedExercise {
  const { profile, phase, weekNumber } = ctx;
  const base = getRepRange(profile.primaryTrainingGoal);

  // === sets (с учётом фазы) ===
  const baseSets = role === ExerciseRole.MAIN_LIFT ? base.setsMax : base.setsMin;
  let sets = Math.round(baseSets * phase.volumeModifier);

  // === RIR ===
  let targetRIR = role === ExerciseRole.MAIN_LIFT ? base.targetRIRMin : base.targetRIRMax;
  if (phase.phase === ProgramPhase.DELOAD) targetRIR += 1;
  if (phase.phase === ProgramPhase.INTENSIFICATION) targetRIR = Math.max(1, targetRIR - 1);

  // === Lifestyle adjustments ===
  if (profile.stressLevel === StressLevel.HIGH || profile.sleepHoursAvg < 6) {
    if (weekNumber <= 2) {
      sets = Math.max(1, Math.round(sets * 0.9));
      targetRIR += 1;
    }
  }

  sets = Math.max(1, sets);
  targetRIR = Math.max(0, Math.min(5, targetRIR));

  // === target load (если baseline есть для этого упражнения) ===
  const targetLoadKg = inferTargetLoadFromBaseline(ex, profile, phase);

  return {
    exerciseId: ex.id,
    exerciseSlug: ex.slug,
    role,
    orderIndex,
    sets,
    repsMin: base.repsMin,
    repsMax: base.repsMax,
    targetRIR,
    targetLoadKg,
    loadPctE1RM: null,
    restSeconds: base.restSeconds,
    tempo: null,
    notes: null,
  };
}

function inferTargetLoadFromBaseline(
  ex: ExerciseCatalogItem,
  profile: ProfileConfig,
  phase: PhaseConfig,
): number | null {
  const baseline = profile.baselineStrength;
  if (!baseline) return null;

  // Грубое сопоставление slug ↔ baseline-lift
  let base1RM: number | null = null;
  const slug = ex.slug.toLowerCase();
  if (slug.includes('squat') && baseline.squatKg) base1RM = baseline.squatKg;
  else if (slug.includes('bench') && baseline.benchKg) base1RM = baseline.benchKg;
  else if (slug.includes('deadlift') && baseline.deadliftKg) base1RM = baseline.deadliftKg;

  if (!base1RM || !isCompoundByPatterns(ex.movementPatterns)) return null;

  // intensityModifier фазы — процент от 1RM (0.65..0.95)
  const loadPct = phase.intensityModifier;
  return Math.round(base1RM * loadPct * 2) / 2; // округление до 0.5 кг
}
