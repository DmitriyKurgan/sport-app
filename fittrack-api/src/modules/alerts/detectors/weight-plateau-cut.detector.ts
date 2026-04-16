import { DetectionResult, WeightPlateauCutContext } from '../interfaces';

const PLATEAU_THRESHOLD_KG = 0.2; // |delta| < 0.2 кг = плато

/**
 * Плато веса на cut: 14-day rolling avg не меняется > 0.2 кг.
 * Срабатывает только если bodyweightGoal === 'cut'.
 *
 * Источник: sport-research.md → progressTracking.alerts.weightPlateauCut.
 */
export function detectWeightPlateauCut(
  ctx: WeightPlateauCutContext,
): DetectionResult | null {
  if (ctx.bodyweightGoal !== 'cut') return null;
  if (ctx.weightTrend.length < 14) return null;

  // Сравниваем avg14d на самой старой и самой свежей точке последних 14 дней.
  const recent = ctx.weightTrend.slice(-14);
  const first = recent[0];
  const last = recent[recent.length - 1];

  // Если у любой точки нет avg14d — мало данных
  if (first.avg14d === null || last.avg14d === null) return null;

  const delta = Math.abs(last.avg14d - first.avg14d);
  if (delta >= PLATEAU_THRESHOLD_KG) return null;

  return {
    type: 'weight_plateau_cut',
    severity: 'info',
    title: 'Плато веса на cut',
    message: `Вес не меняется уже 2 недели (изменение ${delta.toFixed(2)} кг по 14-day avg).`,
    recommendation:
      'Уменьшите калории на 100 ккал/день ИЛИ добавьте +1500 шагов/день. Не выходите за рамки безопасного темпа потери (макс 1 кг/нед).',
    context: {
      avg14dStart: first.avg14d,
      avg14dEnd: last.avg14d,
      deltaKg: delta,
    },
  };
}
