import { ScoringInputs } from '../interfaces';
import {
  REF_CIRCUMFERENCE_INDEX,
  REF_RELATIVE_STRENGTH,
  zScore,
} from './reference-population';

/**
 * Muscularity score — показатель "мышечной составляющей".
 *   relativeStrengthIndex = max(e1RM squat/bench/deadlift) / weightKg
 *
 * Если e1RM нет ни у одного упражнения → muscularity=0 (нейтрально,
 * т.к. scoring пересчитается после первых тренировок).
 *
 * Если есть окружности chest + biceps → добавляем circumferenceIndex.
 */
export function calculateMuscularityScore(inputs: ScoringInputs): number {
  const lifts = [inputs.e1rmSquatKg, inputs.e1rmBenchKg, inputs.e1rmDeadliftKg]
    .filter((v): v is number => typeof v === 'number' && v > 0);

  let zStrength: number | null = null;
  if (lifts.length > 0 && inputs.weightKg > 0) {
    const maxLift = Math.max(...lifts);
    const rsi = maxLift / inputs.weightKg;
    zStrength = zScore(rsi, REF_RELATIVE_STRENGTH.mean, REF_RELATIVE_STRENGTH.sd);
  }

  let zCirc: number | null = null;
  if (inputs.chestCm && inputs.bicepsCm && inputs.heightCm > 0) {
    const ci = (inputs.chestCm + inputs.bicepsCm) / inputs.heightCm;
    zCirc = zScore(ci, REF_CIRCUMFERENCE_INDEX.mean, REF_CIRCUMFERENCE_INDEX.sd);
  }

  const parts = [zStrength, zCirc].filter((v): v is number => v !== null);
  if (parts.length === 0) return 0;

  const avg = parts.reduce((s, v) => s + v, 0) / parts.length;
  return round2(avg);
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
