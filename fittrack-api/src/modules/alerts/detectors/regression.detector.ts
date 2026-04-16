import { DetectionResult, RegressionContext } from '../interfaces';

const E1RM_DROP_THRESHOLD_PCT = 5; // > 5% падение

/**
 * Регресс показателей: падение e1RM > 5% И растущий session-RPE.
 * Источник: sport-research.md → progressTracking.alerts.regression.
 */
export function detectRegression(ctx: RegressionContext): DetectionResult | null {
  if (ctx.recentE1RM.length < 3) return null;

  const dropPct = calculateE1RMDropPct(ctx.recentE1RM);
  if (dropPct < E1RM_DROP_THRESHOLD_PCT) return null;

  if (!isMonotonicIncreasing(ctx.sessionRPETrend)) return null;

  return {
    type: 'regression',
    severity: 'critical',
    title: 'Регресс показателей',
    message: `e1RM упал на ${dropPct.toFixed(1)}%, при этом субъективная тяжесть растёт.`,
    recommendation:
      'Запланируйте Recovery-неделю (делoad: −40% объёма, −7% интенсивности). Это позволит восстановиться без потери прогресса.',
    context: {
      e1rmDropPct: dropPct,
      lastE1RMs: ctx.recentE1RM.slice(-3),
      sessionRPETrend: ctx.sessionRPETrend.slice(-3),
    },
  };
}

/**
 * Pure: % падения последнего значения от ЛУЧШЕГО из двух предыдущих.
 * Возвращает 0 если истории недостаточно или нет падения.
 */
export function calculateE1RMDropPct(history: number[]): number {
  if (history.length < 3) return 0;
  const lastThree = history.slice(-3);
  const peak = Math.max(lastThree[0], lastThree[1]);
  const current = lastThree[2];
  if (peak === 0 || current >= peak) return 0;
  return ((peak - current) / peak) * 100;
}

/** Pure: монотонно ли растёт массив (последовательно)? */
export function isMonotonicIncreasing(values: number[]): boolean {
  if (values.length < 2) return false;
  for (let i = 1; i < values.length; i++) {
    if (values[i] <= values[i - 1]) return false;
  }
  return true;
}
