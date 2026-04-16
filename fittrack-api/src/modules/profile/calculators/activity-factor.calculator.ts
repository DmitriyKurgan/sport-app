import { DailyActivityLevel } from '../enums';

/**
 * Коэффициент активности для формулы TDEE = REE * factor.
 * Матрица из architecture.md 2.2.
 *
 * Входы:
 *   - dailyActivityLevel: базовый уровень бытовой активности
 *   - weeklyTrainingDaysTarget: 2-6 тренировок/нед
 *
 * low = 2-3 трен/нед; high = 4+ трен/нед
 */
export function calculateActivityFactor(params: {
  dailyActivityLevel: DailyActivityLevel;
  weeklyTrainingDaysTarget: number;
}): number {
  const { dailyActivityLevel, weeklyTrainingDaysTarget } = params;
  const intense = weeklyTrainingDaysTarget >= 4;

  const matrix: Record<DailyActivityLevel, { low: number; high: number }> = {
    [DailyActivityLevel.SEDENTARY]: { low: 1.375, high: 1.55 },
    [DailyActivityLevel.MODERATE]: { low: 1.55, high: 1.725 },
    [DailyActivityLevel.ACTIVE]: { low: 1.725, high: 1.9 },
  };

  const row = matrix[dailyActivityLevel];
  return intense ? row.high : row.low;
}
