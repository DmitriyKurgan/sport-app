import { SetLog } from '../interfaces';

/**
 * Volume Load = Σ(sets × reps × weight), исключая warmup'ы.
 * Базовый показатель внешней тренировочной нагрузки.
 * Источник: sport-research.md → progressTracking.metrics.
 */
export function calculateVolumeLoad(logs: SetLog[]): number {
  return logs
    .filter((l) => !l.isWarmup)
    .reduce((sum, l) => sum + l.weightKg * l.reps, 0);
}
