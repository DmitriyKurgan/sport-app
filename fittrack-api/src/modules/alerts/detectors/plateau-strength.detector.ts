import { DetectionResult, PlateauContext } from '../interfaces';

const VARIATION_THRESHOLD = 0.01; // 1% — порог "плато"
const ADHERENCE_FLOOR = 80; // ниже — это не плато, а просто пропуски
const MIN_WEEKS_HISTORY = 2;

/**
 * Плато по силе: e1RM на main_lift не растёт ≥2 недели подряд при хорошей регулярности.
 *
 * Возвращает первый найденный alert (по первому main_lift в плато).
 * Если всё ок — null.
 *
 * Источник: sport-research.md → progressTracking.alerts.plateauStrength.
 */
export function detectStrengthPlateau(ctx: PlateauContext): DetectionResult | null {
  if (ctx.adherencePct < ADHERENCE_FLOOR) return null;

  for (const lift of ctx.mainLifts) {
    const recent = lift.history.slice(-3);
    if (recent.length < MIN_WEEKS_HISTORY) continue;

    if (maxRelativeVariation(recent) < VARIATION_THRESHOLD) {
      return {
        type: 'plateau_strength',
        severity: 'warning',
        title: 'Плато по силе',
        message: `${lift.exerciseName ?? 'Упражнение'} не растёт ${recent.length} недели подряд.`,
        recommendation:
          'Уменьшите объём на 1 микроцикл или сделайте внеплановый делoad. Это разгрузит ЦНС и часто пробивает плато.',
        context: {
          exerciseId: lift.exerciseId,
          weeks: recent.length,
          currentE1RM: recent[recent.length - 1],
          adherencePct: ctx.adherencePct,
        },
      };
    }
  }
  return null;
}

/**
 * Pure: максимальная относительная вариация в массиве (max-min)/mean.
 * 0 = все значения равны, 0.05 = 5% разброса.
 */
export function maxRelativeVariation(values: number[]): number {
  if (values.length < 2) return Infinity;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  if (mean === 0) return 0;
  return (max - min) / mean;
}
