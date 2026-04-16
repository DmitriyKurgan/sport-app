import { ScoringInputs } from '../interfaces';
import { REF_BMI, REF_WAIST_TO_HEIGHT, zScore } from './reference-population';

/**
 * Adiposity score — показатель "жировой составляющей".
 *   база:      z(BMI)
 *   усиление:  z(waistToHeight) если waistCm задан
 *
 * Финальный score — среднее двух компонентов (если оба есть), иначе только z(BMI).
 * Положительный score = больше адипозности чем средний референс.
 */
export function calculateAdiposityScore(inputs: ScoringInputs): number {
  const bmi = inputs.weightKg / Math.pow(inputs.heightCm / 100, 2);
  const zBmi = zScore(bmi, REF_BMI.mean, REF_BMI.sd);

  if (inputs.waistCm && inputs.heightCm > 0) {
    const wth = inputs.waistCm / inputs.heightCm;
    const zWth = zScore(wth, REF_WAIST_TO_HEIGHT.mean, REF_WAIST_TO_HEIGHT.sd);
    return round2((zBmi + zWth) / 2);
  }

  return round2(zBmi);
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
