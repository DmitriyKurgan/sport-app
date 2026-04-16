import { BodyMeasurement, ProgressLog, SessionRPELog } from '../entities';

export class ProgressLogResponseDto {
  id!: string;
  exerciseId!: string;
  trainingDayId!: string | null;
  dayExerciseId!: string | null;
  setNumber!: number;
  weightKg!: number;
  reps!: number;
  rir!: number | null;
  rpe!: number | null;
  estimated1rm!: number | null;
  volumeLoad!: number | null;
  isWarmup!: boolean;
  notes!: string | null;
  performedAt!: Date;

  static fromEntity(log: ProgressLog): ProgressLogResponseDto {
    const dto = new ProgressLogResponseDto();
    dto.id = log.id;
    dto.exerciseId = log.exerciseId;
    dto.trainingDayId = log.trainingDayId;
    dto.dayExerciseId = log.dayExerciseId;
    dto.setNumber = log.setNumber;
    dto.weightKg = log.weightKg;
    dto.reps = log.reps;
    dto.rir = log.rir;
    dto.rpe = log.rpe;
    dto.estimated1rm = log.estimated1rm;
    dto.volumeLoad = log.volumeLoad;
    dto.isWarmup = log.isWarmup;
    dto.notes = log.notes;
    dto.performedAt = log.performedAt;
    return dto;
  }
}

export class SessionRPEResponseDto {
  id!: string;
  trainingDayId!: string;
  sessionRpe!: number;
  durationMinutes!: number;
  internalLoad!: number;
  recordedAt!: Date;

  static fromEntity(log: SessionRPELog): SessionRPEResponseDto {
    const dto = new SessionRPEResponseDto();
    dto.id = log.id;
    dto.trainingDayId = log.trainingDayId;
    dto.sessionRpe = log.sessionRpe;
    dto.durationMinutes = log.durationMinutes;
    dto.internalLoad = log.internalLoad;
    dto.recordedAt = log.recordedAt;
    return dto;
  }
}

export class BodyMeasurementResponseDto {
  id!: string;
  weightKg!: number;
  bodyFatPercent!: number | null;
  chestCm!: number | null;
  waistCm!: number | null;
  hipsCm!: number | null;
  bicepsCm!: number | null;
  thighCm!: number | null;
  photoUrl!: string | null;
  measuredAt!: Date;

  static fromEntity(m: BodyMeasurement): BodyMeasurementResponseDto {
    const dto = new BodyMeasurementResponseDto();
    dto.id = m.id;
    dto.weightKg = m.weightKg;
    dto.bodyFatPercent = m.bodyFatPercent;
    dto.chestCm = m.chestCm;
    dto.waistCm = m.waistCm;
    dto.hipsCm = m.hipsCm;
    dto.bicepsCm = m.bicepsCm;
    dto.thighCm = m.thighCm;
    dto.photoUrl = m.photoUrl;
    dto.measuredAt = m.measuredAt;
    return dto;
  }
}

export class PersonalRecordDto {
  exerciseId!: string;
  prWeightKg!: number;
  prE1rmKg!: number;
  achievedAt!: Date;
}

export class WeeklyAggregateDto {
  weekStart!: Date; // Monday
  value!: number;
}

export class WeightTrendPointDto {
  date!: Date;
  weightKg!: number;
  avg7d!: number | null;
  avg14d!: number | null;
}
