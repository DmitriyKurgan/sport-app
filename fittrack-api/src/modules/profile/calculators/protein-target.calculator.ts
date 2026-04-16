import { BodyweightGoal, NutritionTier } from '../enums';

/**
 * Целевой белок в граммах/день.
 * Источник: sport-research.md → nutritionSystem.macroDistribution.protein.
 *
 *   default:              1.6 г/кг
 *   range:                1.4–2.2 г/кг
 *   cut + advanced tier:  2.3–3.1 г/кг (default 2.3 — нижняя граница)
 */
export function calculateProteinTarget(params: {
  weightKg: number;
  bodyweightGoal: BodyweightGoal;
  tier: NutritionTier;
}): number {
  const { weightKg, bodyweightGoal, tier } = params;
  const gPerKg =
    bodyweightGoal === BodyweightGoal.CUT && tier === NutritionTier.ADVANCED ? 2.3 : 1.6;
  return Math.round(weightKg * gPerKg);
}
