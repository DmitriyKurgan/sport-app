import { DetectionResult, OvertrainingContext } from '../interfaces';

const HIGH_RPE_THRESHOLD = 8;
const SLEEP_FLOOR_HOURS = 6;
const REQUIRED_STREAK = 3;

/**
 * Перетренированность: avg session-RPE > 8 три недели подряд + сон < 6ч.
 *
 * Источник: sport-research.md → progressTracking.alerts.overtraining.
 */
export function detectOvertraining(ctx: OvertrainingContext): DetectionResult | null {
  if (ctx.sleepHoursAvg >= SLEEP_FLOOR_HOURS) return null;
  if (ctx.weeklySessionRPE.length < REQUIRED_STREAK) return null;

  const lastN = ctx.weeklySessionRPE.slice(-REQUIRED_STREAK);
  const allHigh = lastN.every((w) => w.avgSessionRPE > HIGH_RPE_THRESHOLD);
  if (!allHigh) return null;

  return {
    type: 'overtraining',
    severity: 'critical',
    title: 'Риск перетренированности',
    message: `High session-RPE (>${HIGH_RPE_THRESHOLD}) ${REQUIRED_STREAK} недели подряд при сне ${ctx.sleepHoursAvg.toFixed(1)} ч/ночь.`,
    recommendation:
      'Принудительный делoad на следующую неделю + увеличьте сон до 7+ часов. Игнорировать опасно — растёт риск травм и стойкого регресса.',
    context: {
      avgSessionRPELastWeeks: lastN.map((w) => w.avgSessionRPE),
      sleepHoursAvg: ctx.sleepHoursAvg,
    },
  };
}
