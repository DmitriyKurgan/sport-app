import { Gender } from '../enums';

/**
 * REE (Resting Energy Expenditure) по формуле Mifflin–St Jeor.
 * Источник: sport-research.md → nutritionSystem.calorieLogic.reeFormula.
 *
 * Male:   REE = 10*weight + 6.25*height - 5*age + 5
 * Female: REE = 10*weight + 6.25*height - 5*age - 161
 *
 * @returns REE в ккал/день, округлённый до целого
 */
export function calculateREE(params: {
  sex: Gender;
  weightKg: number;
  heightCm: number;
  ageYears: number;
}): number {
  const { sex, weightKg, heightCm, ageYears } = params;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  const ree = sex === Gender.MALE ? base + 5 : base - 161;
  return Math.round(ree);
}
