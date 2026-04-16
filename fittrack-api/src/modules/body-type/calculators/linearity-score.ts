import { ScoringInputs } from '../interfaces';
import { REF_HTM, zScore } from './reference-population';

/**
 * Linearity score — показатель "линейности/эктоморфности".
 *   heightToMassIndex = heightCm / weightKg^(1/3)
 *
 * Положительный score = более линейное телосложение (эктоморфное),
 * отрицательный = более плотное.
 *
 * Этот индекс — часть соматотипа Хит–Картера.
 */
export function calculateLinearityScore(inputs: ScoringInputs): number {
  if (inputs.weightKg <= 0) return 0;
  const htm = inputs.heightCm / Math.pow(inputs.weightKg, 1 / 3);
  const z = zScore(htm, REF_HTM.mean, REF_HTM.sd);
  return Math.round(z * 100) / 100;
}
