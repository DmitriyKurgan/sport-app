import { AlertSeverity, AlertType } from '../alert.entity';

/** Результат работы detector — Alert или null если ничего не обнаружено. */
export interface DetectionResult {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  recommendation: string;
  context?: Record<string, unknown>;
}

/**
 * История e1RM по неделям для конкретного main_lift.
 * Используется в plateau-strength.
 */
export interface E1RMByWeek {
  exerciseId: string;
  exerciseName?: string;
  /** Массив [неделя1.e1rm, неделя2.e1rm, ...]. Минимум 2 значения для срабатывания. */
  history: number[];
}

/** Сессионный показатель по неделе. */
export interface WeeklySessionMetric {
  weekStart: Date;
  avgSessionRPE: number;
}

/**
 * Вход для plateau-strength.
 *   adherencePct < 80 → детектор не срабатывает (это не плато, а пропуски)
 */
export interface PlateauContext {
  mainLifts: E1RMByWeek[];
  adherencePct: number;
}

export interface RegressionContext {
  /** Последние 3 значения e1RM (любое упражнение или усреднённое). */
  recentE1RM: number[];
  /** Тренд session-RPE: последние 3 значения. */
  sessionRPETrend: number[];
}

export interface WeightPlateauCutContext {
  bodyweightGoal: 'cut' | 'maintain' | 'bulk';
  /** weightTrend: точки с avg14d, минимум 14 дней покрытия. */
  weightTrend: Array<{ date: Date; avg14d: number | null }>;
}

export interface OvertrainingContext {
  /** Последние 3 недели session-RPE. */
  weeklySessionRPE: WeeklySessionMetric[];
  sleepHoursAvg: number;
}
