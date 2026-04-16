export interface CreateProgressLogRequest {
  exerciseId: string;
  trainingDayId?: string;
  dayExerciseId?: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  rir?: number;
  rpe?: number;
  isWarmup?: boolean;
  notes?: string;
}

export interface ProgressLog {
  id: string;
  exerciseId: string;
  trainingDayId: string | null;
  dayExerciseId: string | null;
  setNumber: number;
  weightKg: number;
  reps: number;
  rir: number | null;
  rpe: number | null;
  estimated1rm: number | null;
  volumeLoad: number | null;
  isWarmup: boolean;
  notes: string | null;
  performedAt: string;
}

export interface LogSessionRPERequest {
  trainingDayId: string;
  sessionRpe: number;
  durationMinutes: number;
}

export interface SessionRPELog {
  id: string;
  trainingDayId: string;
  sessionRpe: number;
  durationMinutes: number;
  internalLoad: number;
  recordedAt: string;
}

export interface CreateBodyMeasurementRequest {
  weightKg: number;
  bodyFatPercent?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  bicepsCm?: number;
  thighCm?: number;
  photoUrl?: string;
}

export interface BodyMeasurement {
  id: string;
  weightKg: number;
  bodyFatPercent: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  bicepsCm: number | null;
  thighCm: number | null;
  photoUrl: string | null;
  measuredAt: string;
}

export interface PersonalRecord {
  exerciseId: string;
  prWeightKg: number;
  prE1rmKg: number;
  achievedAt: string;
}

export interface WeeklyAggregate {
  weekStart: string;
  value: number;
}

export interface WeightTrendPoint {
  date: string;
  weightKg: number;
  avg7d: number | null;
  avg14d: number | null;
}
