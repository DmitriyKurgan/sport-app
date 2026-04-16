import { DELOAD_WEEKS, PROGRESSION } from '../constants';
import { DeloadContext, DeloadDecision } from '../interfaces';

/**
 * Решение: нужен ли делoad на текущей неделе?
 *
 * Источник: sport-research.md — deload triggers + architecture.md 4.5.
 *
 * Триггеры (любой → деloаd):
 *   1. Плановый (недели 4, 8, 12)
 *   2. RIR-истощение: avg RIR < 1 три недели подряд
 *   3. Session-RPE перегрузка: avg > 9 три недели подряд
 *   4. Регресс e1RM: > 5% падение на двух последних точках
 */
export function shouldDeload(ctx: DeloadContext): DeloadDecision {
  // 1. Плановый
  if (DELOAD_WEEKS.includes(ctx.weekNumber)) {
    return { shouldDeload: true, reason: 'scheduled' };
  }

  // 2. RIR exhaustion
  if (isRirExhausted(ctx.avgRIRPerWeek)) {
    return { shouldDeload: true, reason: 'rir_exhaustion' };
  }

  // 3. session-RPE overload
  if (isSessionRPEOverloaded(ctx.avgSessionRPEPerWeek)) {
    return { shouldDeload: true, reason: 'session_rpe_overload' };
  }

  // 4. e1RM regression
  if (detectE1RMDrop(ctx.e1rmHistory, PROGRESSION.e1RMDropThresholdPct)) {
    return { shouldDeload: true, reason: 'e1rm_regression' };
  }

  return { shouldDeload: false, reason: '' };
}

function isRirExhausted(avgRIRPerWeek: number[]): boolean {
  if (avgRIRPerWeek.length < PROGRESSION.forcedDeloadStreak) return false;
  const lastN = avgRIRPerWeek.slice(-PROGRESSION.forcedDeloadStreak);
  return lastN.every((r) => r < 1);
}

function isSessionRPEOverloaded(avgSessionRPEPerWeek: number[]): boolean {
  if (avgSessionRPEPerWeek.length < PROGRESSION.forcedDeloadStreak) return false;
  const lastN = avgSessionRPEPerWeek.slice(-PROGRESSION.forcedDeloadStreak);
  return lastN.every((rpe) => rpe > PROGRESSION.forcedDeloadRPEThreshold);
}

/**
 * Регресс: последняя точка e1RM упала более чем на thresholdPct относительно
 * ЛУЧШЕЙ из двух предыдущих.
 */
export function detectE1RMDrop(history: number[], thresholdPct: number): boolean {
  if (history.length < 3) return false;
  const lastThree = history.slice(-3);
  const recent = lastThree[2];
  const previousPeak = Math.max(lastThree[0], lastThree[1]);
  if (previousPeak === 0) return false;
  const dropPct = ((previousPeak - recent) / previousPeak) * 100;
  return dropPct > thresholdPct;
}
