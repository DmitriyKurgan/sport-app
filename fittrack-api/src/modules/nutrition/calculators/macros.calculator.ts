import { BodyweightGoal, NutritionTier } from '../../profile/enums';

export interface MacrosResult {
  proteinG: number;
  fatG: number;
  carbsG: number;
  /** Рекомендуемое количество белка на один приём пищи (0.25 г/кг). */
  proteinPerMealG: number;
  /** Диагностика: углеводов на кг веса (athlete framework: 3–12 г/кг). */
  carbsGPerKg: number;
}

const FAT_ENERGY_SHARE = 0.25; // 25% энергии

/**
 * Расчёт БЖУ.
 * Источник: sport-research.md → nutritionSystem.macroDistribution.
 *
 * Алгоритм:
 *   1. Белок: default 1.6 г/кг (range 1.4–2.2 г/кг).
 *              cut + advanced tier → 2.3 г/кг (для сохранения LBM в дефиците).
 *   2. Жиры: 25% энергии (range 20–35%).
 *   3. Углеводы: остаток калорий.
 *   4. Если углеводов < 3 г/кг (нижняя граница athlete framework) —
 *      перераспределяем: снижаем белок до 1.4 г/кг и/или жиры до 20%.
 */
export function calculateMacros(params: {
  weightKg: number;
  calories: number;
  bodyweightGoal: BodyweightGoal;
  tier: NutritionTier;
}): MacrosResult {
  const { weightKg, calories, bodyweightGoal, tier } = params;

  // Стартовые значения
  let proteinGPerKg = 1.6;
  if (bodyweightGoal === BodyweightGoal.CUT && tier === NutritionTier.ADVANCED) {
    proteinGPerKg = 2.3;
  }
  let fatShare = FAT_ENERGY_SHARE;

  let result = computeMacros(weightKg, calories, proteinGPerKg, fatShare);

  // Safeguard: если углеводов < 3 г/кг — перераспределяем
  if (result.carbsGPerKg < 3) {
    // Снижаем белок до 1.4 г/кг (нижняя граница range)
    proteinGPerKg = Math.max(1.4, proteinGPerKg - 0.2);
    // Снижаем жиры до 20%
    fatShare = 0.2;
    result = computeMacros(weightKg, calories, proteinGPerKg, fatShare);
  }

  return result;
}

function computeMacros(
  weightKg: number,
  calories: number,
  proteinGPerKg: number,
  fatShare: number,
): MacrosResult {
  const proteinG = weightKg * proteinGPerKg;
  const fatG = (calories * fatShare) / 9;
  const carbsKcal = calories - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(0, carbsKcal / 4);

  return {
    proteinG: Math.round(proteinG),
    fatG: Math.round(fatG),
    carbsG: Math.round(carbsG),
    proteinPerMealG: Math.round(weightKg * 0.25),
    carbsGPerKg: Math.round((carbsG / weightKg) * 10) / 10,
  };
}
