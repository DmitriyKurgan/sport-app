/**
 * Интерфейсы для прогрессии и делoad (вход/выход calculator'ов).
 */

/** Один выполненный подход. */
export interface SetLog {
  weightKg: number;
  reps: number;
  rir?: number | null;
  rpe?: number | null;
  isWarmup?: boolean;
}

/** План подхода на будущую неделю. */
export interface PlannedExercise {
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  targetRIR: number;
  targetLoadKg: number | null;
  isCompound: boolean;
}

export type ProgressionAction = 'INCREASE_LOAD' | 'HOLD' | 'REGRESS';

export interface ProgressionResult {
  action: ProgressionAction;
  newWeightKg: number | null;
  newRepsMin?: number;
  newRepsMax?: number;
  /** Если HOLD и мы хотим увеличить целевые повторы. */
  targetRepsIncrement?: number;
  reason: string;
}

/** Контекст для принятия решения о деloаде. */
export interface DeloadContext {
  weekNumber: number;
  /** Средний RIR по main_lifts за последние недели. */
  avgRIRPerWeek: number[];
  /** Средний session-RPE по неделям. */
  avgSessionRPEPerWeek: number[];
  /** e1RM тренд: значения по неделям. */
  e1rmHistory: number[];
}

export interface DeloadDecision {
  shouldDeload: boolean;
  reason: 'scheduled' | 'rir_exhaustion' | 'session_rpe_overload' | 'e1rm_regression' | '';
}

/** Результат калибровки стартовых весов по неделе 1 (когда нет baseline). */
export interface RecalibrationResult {
  exerciseId: string;
  calibratedLoadKg: number;
  reason: string;
}
