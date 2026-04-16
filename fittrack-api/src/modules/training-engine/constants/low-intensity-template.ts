import { MovementPattern } from '../enums';
import { DayPatternMap } from './splits';

/**
 * Шаблон программы для пользователей с red flags по PAR-Q+.
 *
 * Принципы (sport-research.md — safety):
 *   - bodyweight-only (ничего не падает с большой высоты)
 *   - низкие нагрузки, 3 трен/нед максимум
 *   - высокий target_rir=4 (никогда близко к отказу)
 *   - 3 подхода × 10-12 повторов
 *   - упор на технику, а не на прогрессию
 *   - никакого forced deload — deload каждая 4-я неделя как обычно
 *
 * UI показывает рекомендацию проконсультироваться со специалистом.
 */

export const LOW_INTENSITY_CONFIG = {
  weeklyDays: 3,
  targetRIR: 4,
  repsMin: 10,
  repsMax: 12,
  sets: 3,
  restSeconds: 60,
  /** Приоритет equipment: только bodyweight. */
  onlyBodyweight: true,
} as const;

/**
 * Фиксированный набор 3-х дней — Full Body с минимальной нагрузкой.
 * Простые движения без сложной техники.
 */
export const LOW_INTENSITY_DAYS: DayPatternMap[] = [
  {
    splitTag: 'low_intensity_a',
    name: 'Лёгкая тренировка A',
    patterns: [MovementPattern.SQUAT, MovementPattern.HORIZONTAL_PUSH, MovementPattern.CORE],
  },
  {
    splitTag: 'low_intensity_b',
    name: 'Лёгкая тренировка B',
    patterns: [MovementPattern.HINGE, MovementPattern.HORIZONTAL_PULL, MovementPattern.CORE],
  },
  {
    splitTag: 'low_intensity_c',
    name: 'Лёгкая тренировка C',
    patterns: [MovementPattern.LUNGE, MovementPattern.VERTICAL_PULL, MovementPattern.CORE],
  },
];
