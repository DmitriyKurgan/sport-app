/**
 * Доменные события ProgressModule.
 * Подписчиками будут AlertsModule (детекторы плато/регресса) и AnalyticsModule
 * (инвалидация Redis-кэша) на этапах 10-11.
 */

export const PROGRESS_LOGGED = 'progress.logged';
export const SESSION_RPE_LOGGED = 'session.rpe.logged';
export const BODY_MEASUREMENT_ADDED = 'body.measurement.added';

export interface ProgressLoggedEvent {
  userId: string;
  exerciseId: string;
  trainingDayId: string | null;
  setNumber: number;
  weightKg: number;
  reps: number;
  rir: number | null;
  estimated1rm: number | null;
  volumeLoad: number | null;
  isWarmup: boolean;
  performedAt: Date;
}

export interface SessionRPELoggedEvent {
  userId: string;
  trainingDayId: string;
  sessionRpe: number;
  durationMinutes: number;
  internalLoad: number;
  recordedAt: Date;
}

export interface BodyMeasurementAddedEvent {
  userId: string;
  weightKg: number;
  measuredAt: Date;
}
