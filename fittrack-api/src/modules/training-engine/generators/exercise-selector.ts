import { EQUIPMENT_ACCESS_RANK, ExperienceLevel, InjuryFlag } from '../../profile/enums';
import { ExerciseRole, MovementPattern } from '../enums';
import { ExerciseCatalogItem, ProfileConfig } from '../interfaces';

/**
 * Фильтр + ранжирование упражнений под конкретный день/pattern.
 *
 * Этапы:
 *   1. Фильтр по оборудованию (equipmentAccessMin <= profile.equipmentAccess)
 *   2. Фильтр по травмам (пересечение contraindications и injuryPainFlags → исключить)
 *   3. Фильтр по уровню сложности (novice → 1-2, intermediate → 2-4, else → 1-5)
 *   4. Фильтр по exclude (уже выбранные slug'и — не дублируем)
 *   5. Фильтр по pattern (exercise должен содержать pattern в movementPatterns)
 *   6. Для role=main_lift приоритет compound (не ISOLATION)
 *   7. Coverage scoring + сортировка
 */

export interface SelectExercisesOptions {
  patterns: MovementPattern[];
  catalog: ExerciseCatalogItem[];
  profile: ProfileConfig;
  role: ExerciseRole;
  excludeSlugs?: Set<string>;
  /** Если true — вернуть только упражнения с equipmentRequired=['bodyweight']. */
  bodyweightOnly?: boolean;
}

export interface SelectedExercise {
  exercise: ExerciseCatalogItem;
  pattern: MovementPattern; // для которого был выбран
}

/**
 * Для каждого pattern из списка — подбирает ОДНО наиболее подходящее упражнение.
 * Возвращает массив той же длины, что и patterns (если для pattern нет кандидатов — пропускается).
 */
export function selectExercisesForPatterns(
  opts: SelectExercisesOptions,
): SelectedExercise[] {
  const { patterns, catalog, profile, role, excludeSlugs = new Set() } = opts;

  const eligible = filterEligible(catalog, profile, excludeSlugs, opts.bodyweightOnly);

  const selected: SelectedExercise[] = [];
  const usedSlugs = new Set<string>(excludeSlugs);

  for (const pattern of patterns) {
    const candidates = eligible.filter(
      (e) => e.movementPatterns.includes(pattern) && !usedSlugs.has(e.slug),
    );
    if (candidates.length === 0) continue;

    const ranked = rankCandidates(candidates, pattern, role, profile);
    const chosen = ranked[0];
    selected.push({ exercise: chosen, pattern });
    usedSlugs.add(chosen.slug);
  }

  return selected;
}

// === фильтры ===

export function filterEligible(
  catalog: ExerciseCatalogItem[],
  profile: ProfileConfig,
  excludeSlugs: Set<string>,
  bodyweightOnly = false,
): ExerciseCatalogItem[] {
  const userEquipRank = EQUIPMENT_ACCESS_RANK[profile.equipmentAccess];
  const injuries: Set<InjuryFlag> = new Set(
    profile.injuryPainFlags.filter((f) => f !== InjuryFlag.NONE),
  );
  const difficultyMax = maxDifficultyForLevel(profile.experienceLevel);

  return catalog.filter((ex) => {
    // 1. exclude (уже выбранные)
    if (excludeSlugs.has(ex.slug)) return false;

    // 2. equipment
    const exRank = EQUIPMENT_ACCESS_RANK[ex.equipmentAccessMin];
    if (exRank > userEquipRank) return false;

    // bodyweight-only mode (для LOW_INTENSITY)
    if (bodyweightOnly && !ex.equipmentRequired.includes('bodyweight')) return false;

    // 3. injuries: contraindications ∩ injuries должно быть пусто
    if (ex.contraindications.some((c) => injuries.has(c))) return false;

    // 4. difficulty
    if (ex.difficulty > difficultyMax) return false;

    return true;
  });
}

function maxDifficultyForLevel(level: ExperienceLevel): number {
  switch (level) {
    case ExperienceLevel.NONE:
      return 2;
    case ExperienceLevel.NOVICE:
      return 3;
    case ExperienceLevel.INTERMEDIATE:
      return 5;
    default:
      return 5;
  }
}

// === ранжирование ===

/**
 * Оценка кандидата:
 *   - role=main_lift: compound > isolation, низкий technicalDemand для novice, меньше сложность
 *   - role=accessory: isolation или compound с низкой сложностью
 *   - бонус за progressionChain — значит упражнение в системе прогрессии
 */
function rankCandidates(
  candidates: ExerciseCatalogItem[],
  pattern: MovementPattern,
  role: ExerciseRole,
  profile: ProfileConfig,
): ExerciseCatalogItem[] {
  return [...candidates].sort((a, b) => scoreFor(b, pattern, role, profile) - scoreFor(a, pattern, role, profile));
}

function scoreFor(
  ex: ExerciseCatalogItem,
  pattern: MovementPattern,
  role: ExerciseRole,
  profile: ProfileConfig,
): number {
  let score = 0;

  const isIsolation = ex.movementPatterns.every((p) => p === MovementPattern.ISOLATION);
  const isCompound = !isIsolation;

  if (role === ExerciseRole.MAIN_LIFT) {
    // compound сильно в плюс
    score += isCompound ? 20 : -20;
    // для novice — проще технически
    if (profile.experienceLevel === ExperienceLevel.NOVICE) {
      if (ex.technicalDemand === 'low') score += 5;
      if (ex.technicalDemand === 'high') score -= 5;
    }
    // оптимальная сложность для уровня
    score += difficultyBonus(ex.difficulty, profile.experienceLevel);
  } else if (role === ExerciseRole.ACCESSORY) {
    // для ISOLATION-pattern — isolation упражнения в приоритете
    if (pattern === MovementPattern.ISOLATION && isIsolation) score += 10;
    // для остальных patterns аксессуары — лёгкий compound
    if (pattern !== MovementPattern.ISOLATION && isCompound && ex.difficulty <= 3) score += 5;
  }

  // progression chain → в системе прогрессии
  if (ex.progressionChain && ex.progressionChain.length > 0) score += 3;

  // primary pattern match (упражнение "заточено" под этот паттерн)
  if (ex.movementPatterns[0] === pattern) score += 2;

  return score;
}

function difficultyBonus(difficulty: number, level: ExperienceLevel): number {
  // Novice: приоритет 2 > 1 > 3 (не слишком простые, но и не сложные)
  if (level === ExperienceLevel.NOVICE) {
    if (difficulty === 2) return 5;
    if (difficulty === 1) return 2;
    if (difficulty === 3) return 0;
    return -3;
  }
  // Intermediate: приоритет 4 > 3 > 2 > 1 (любит вызов, но в пределах уровня)
  if (level === ExperienceLevel.INTERMEDIATE) {
    if (difficulty === 4) return 5;
    if (difficulty === 3) return 3;
    if (difficulty === 2) return 1;
    if (difficulty === 5) return 0;
    return -2;
  }
  return 0;
}
