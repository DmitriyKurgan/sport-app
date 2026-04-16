import {
  ExperienceLevel,
  StressLevel,
} from '../../profile/enums';
import {
  getPhase,
  getSplitRule,
  LOW_INTENSITY_DAYS,
  TOTAL_WEEKS,
} from '../constants';
import { DayPatternMap, SplitRule } from '../constants/splits';
import { ExerciseRole, MovementPattern, SplitType } from '../enums';
import {
  ExerciseCatalogItem,
  GeneratedProgram,
  GeneratedWeek,
  ProfileConfig,
} from '../interfaces';
import { generateWeek } from './week-generator';
import { selectExercisesForPatterns } from './exercise-selector';

/**
 * Главная функция TrainingEngine: профиль → полная 12-недельная программа.
 *
 * Алгоритм (architecture.md 4.4):
 *   Step 1: pre-screening gate → если redFlags, вернуть LOW_INTENSITY
 *   Step 2: выбор сплита по дням/неделю + beginner cap + recovery gate для 6 дней
 *   Step 3: выбор main_lifts один раз на мезоцикл (4 недели)
 *   Step 4: for week 1..12 → generateWeek с соответствующими main_lifts
 */
export function generateProgram(
  profile: ProfileConfig,
  catalog: ExerciseCatalogItem[],
): GeneratedProgram {
  // === Step 1: pre-screening gate ===
  if (profile.preScreeningRedFlags) {
    return generateLowIntensityProgram(profile, catalog);
  }

  // === Step 2: выбор сплита ===
  const daysTarget = resolveDaysTarget(profile);
  const splitRule = getSplitRule(daysTarget);

  // === Step 3 + 4: по одному набору main_lifts на каждый мезоцикл (4 недели) ===
  const mainLiftsPerMesocycle = new Map<number, Map<MovementPattern, ExerciseCatalogItem>>();
  for (const meso of [1, 2, 3] as const) {
    mainLiftsPerMesocycle.set(
      meso,
      chooseMainLiftsForMesocycle(splitRule, profile, catalog, meso),
    );
  }

  const weeks: GeneratedWeek[] = [];
  for (let weekNumber = 1; weekNumber <= TOTAL_WEEKS; weekNumber++) {
    const phase = getPhase(weekNumber);
    const mainLifts = mainLiftsPerMesocycle.get(phase.mesocycleNumber)!;
    weeks.push(
      generateWeek({
        weekNumber,
        phase,
        splitRule,
        profile,
        catalog,
        mainLifts,
      }),
    );
  }

  return {
    name: buildProgramName(profile, splitRule),
    totalWeeks: TOTAL_WEEKS,
    primaryGoal: profile.primaryTrainingGoal,
    experienceLevel: profile.experienceLevel,
    splitType: splitRule.type,
    weeklyDays: daysTarget,
    isLowIntensityMode: false,
    weeks,
  };
}

/**
 * Шаблон для пользователей с red flags по PAR-Q+:
 * 3 дня bodyweight, 12 недель с тем же phase-скелетом.
 */
export function generateLowIntensityProgram(
  profile: ProfileConfig,
  catalog: ExerciseCatalogItem[],
): GeneratedProgram {
  const lowIntensitySplit: SplitRule = {
    type: SplitType.LOW_INTENSITY,
    days: LOW_INTENSITY_DAYS,
  };

  // Main lifts на весь период — один набор (не меняется).
  // Используем bodyweightOnly фильтр.
  const allMainPatterns = collectUniqueMainPatterns(lowIntensitySplit.days);
  const mainLifts = buildMainLiftsMap(
    allMainPatterns,
    catalog,
    profile,
    /* bodyweightOnly */ true,
  );
  const sharedMainLifts = new Map([...mainLifts]);

  const weeks: GeneratedWeek[] = [];
  for (let weekNumber = 1; weekNumber <= TOTAL_WEEKS; weekNumber++) {
    const phase = getPhase(weekNumber);
    weeks.push(
      generateWeek({
        weekNumber,
        phase,
        splitRule: lowIntensitySplit,
        profile,
        catalog,
        mainLifts: sharedMainLifts,
        bodyweightOnly: true,
      }),
    );
  }

  return {
    name: 'Low Intensity — Bodyweight 3x',
    totalWeeks: TOTAL_WEEKS,
    primaryGoal: profile.primaryTrainingGoal,
    experienceLevel: profile.experienceLevel,
    splitType: SplitType.LOW_INTENSITY,
    weeklyDays: 3,
    isLowIntensityMode: true,
    weeks,
  };
}

// === helpers ===

/**
 * Определение фактического числа тренировочных дней с учётом safeguards.
 *
 *   1. Beginner cap: novice max 4 дня (не 6)
 *   2. Recovery gate для 6 дней: если sleep<7 ИЛИ stress=high → downgrade до 4
 *   3. Минимум 2 дня, максимум 6
 */
export function resolveDaysTarget(profile: ProfileConfig): number {
  let target = profile.weeklyTrainingDaysTarget;

  // Beginner cap
  if (profile.experienceLevel === ExperienceLevel.NOVICE && target > 4) {
    target = 4;
  }
  if (profile.experienceLevel === ExperienceLevel.NONE && target > 3) {
    target = 3;
  }

  // Recovery gate для 6 дней
  if (target === 6) {
    const poorRecovery =
      profile.sleepHoursAvg < 7 || profile.stressLevel === StressLevel.HIGH;
    if (poorRecovery) target = 4;
  }

  return Math.max(2, Math.min(6, target));
}

function collectUniqueMainPatterns(days: DayPatternMap[]): MovementPattern[] {
  const set = new Set<MovementPattern>();
  for (const d of days) {
    for (const p of d.patterns) {
      if (p !== MovementPattern.ISOLATION) set.add(p);
    }
  }
  return [...set];
}

/**
 * Подбор main_lifts для мезоцикла:
 * для каждого уникального "compound"-паттерна (не ISOLATION) из сплита —
 * выбирает одно стабильное упражнение на 4 недели.
 *
 * Для второго/третьего мезоциклов может выбираться другое упражнение через
 * offset seed (чтобы прогрессия не застревала на одном варианте).
 */
function chooseMainLiftsForMesocycle(
  splitRule: SplitRule,
  profile: ProfileConfig,
  catalog: ExerciseCatalogItem[],
  mesocycleNumber: 1 | 2 | 3,
): Map<MovementPattern, ExerciseCatalogItem> {
  const patterns = collectUniqueMainPatterns(splitRule.days);
  const selected = selectExercisesForPatterns({
    patterns,
    catalog,
    profile,
    role: ExerciseRole.MAIN_LIFT,
  });

  const map = new Map<MovementPattern, ExerciseCatalogItem>();

  // Для мезоциклов 2 и 3 пробуем альтернативу из progression_chain если доступно.
  for (const sel of selected) {
    const picked = maybePickAlternative(sel.exercise, catalog, profile, mesocycleNumber);
    map.set(sel.pattern, picked);
  }

  return map;
}

function buildMainLiftsMap(
  patterns: MovementPattern[],
  catalog: ExerciseCatalogItem[],
  profile: ProfileConfig,
  bodyweightOnly: boolean,
): Map<MovementPattern, ExerciseCatalogItem> {
  const selected = selectExercisesForPatterns({
    patterns,
    catalog,
    profile,
    role: ExerciseRole.MAIN_LIFT,
    bodyweightOnly,
  });
  const map = new Map<MovementPattern, ExerciseCatalogItem>();
  for (const s of selected) map.set(s.pattern, s.exercise);
  return map;
}

/**
 * Если у exercise есть progressionChain и пользователь intermediate — для
 * следующих мезоциклов берём следующий уровень в chain.
 */
function maybePickAlternative(
  base: ExerciseCatalogItem,
  catalog: ExerciseCatalogItem[],
  profile: ProfileConfig,
  mesocycleNumber: 1 | 2 | 3,
): ExerciseCatalogItem {
  if (mesocycleNumber === 1 || !base.progressionChain) return base;
  if (profile.experienceLevel === ExperienceLevel.NONE) return base;

  const chain = base.progressionChain;
  const currentIdx = chain.indexOf(base.slug);
  if (currentIdx < 0 || currentIdx >= chain.length - 1) return base;

  const nextSlug = chain[currentIdx + (mesocycleNumber - 1)];
  if (!nextSlug) return base;

  const alternative = catalog.find((e) => e.slug === nextSlug);
  return alternative ?? base;
}

function buildProgramName(profile: ProfileConfig, splitRule: SplitRule): string {
  const goalLabel: Record<string, string> = {
    strength: 'Strength',
    hypertrophy: 'Muscle Gain',
    fitness: 'Fitness',
    endurance_mixed: 'Endurance',
    sport_prep: 'Sport Prep',
  };
  const splitLabel: Record<string, string> = {
    full_body: 'Full Body',
    upper_lower: 'Upper/Lower',
    upper_lower_plus: 'Upper/Lower +',
    ppl: 'PPL',
    low_intensity: 'Low Intensity',
  };
  const g = goalLabel[profile.primaryTrainingGoal] ?? 'Program';
  const s = splitLabel[splitRule.type] ?? 'Custom';
  return `${g} — ${s} ${splitRule.days.length}x`;
}
