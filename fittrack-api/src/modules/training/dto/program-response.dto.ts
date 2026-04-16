import {
  TrainingDay,
  TrainingDayExercise,
  TrainingProgram,
  TrainingWeek,
} from '../entities';

export class DayExerciseDto {
  id!: string;
  exerciseId!: string;
  exerciseSlug!: string;
  exerciseName!: string;
  videoSearchUrl!: string;
  role!: string;
  orderIndex!: number;
  sets!: number;
  repsMin!: number;
  repsMax!: number;
  targetRir!: number | null;
  targetLoadKg!: number | null;
  loadPctE1rm!: number | null;
  restSeconds!: number;
  tempo!: string | null;
  notes!: string | null;

  static fromEntity(de: TrainingDayExercise): DayExerciseDto {
    const dto = new DayExerciseDto();
    dto.id = de.id;
    dto.exerciseId = de.exerciseId;
    dto.exerciseSlug = de.exercise?.slug ?? '';
    const name = de.exercise?.nameRu ?? de.exercise?.name ?? '';
    dto.exerciseName = name;
    dto.videoSearchUrl = buildExerciseVideoSearchUrl(name);
    dto.role = de.role;
    dto.orderIndex = de.orderIndex;
    dto.sets = de.sets;
    dto.repsMin = de.repsMin;
    dto.repsMax = de.repsMax;
    dto.targetRir = de.targetRir;
    dto.targetLoadKg = de.targetLoadKg;
    dto.loadPctE1rm = de.loadPctE1rm;
    dto.restSeconds = de.restSeconds;
    dto.tempo = de.tempo;
    dto.notes = de.notes;
    return dto;
  }
}

function buildExerciseVideoSearchUrl(name: string): string {
  if (!name) return 'https://www.youtube.com/';
  const query = encodeURIComponent(`${name} правильная техника`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

export class DayResponseDto {
  id!: string;
  dayNumber!: number;
  name!: string;
  description!: string | null;
  targetMuscles!: string[];
  isRestDay!: boolean;
  startedAt!: Date | null;
  completedAt!: Date | null;
  exercises!: DayExerciseDto[];

  static fromEntity(day: TrainingDay): DayResponseDto {
    const dto = new DayResponseDto();
    dto.id = day.id;
    dto.dayNumber = day.dayNumber;
    dto.name = day.name;
    dto.description = day.description;
    dto.targetMuscles = day.targetMuscles;
    dto.isRestDay = day.isRestDay;
    dto.startedAt = day.startedAt;
    dto.completedAt = day.completedAt;
    dto.exercises = (day.exercises ?? [])
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(DayExerciseDto.fromEntity);
    return dto;
  }
}

export class WeekResponseDto {
  id!: string;
  weekNumber!: number;
  phase!: string;
  mesocycleNumber!: number;
  description!: string | null;
  isDeload!: boolean;
  intensityModifier!: number;
  volumeModifier!: number;
  days!: DayResponseDto[];

  static fromEntity(week: TrainingWeek): WeekResponseDto {
    const dto = new WeekResponseDto();
    dto.id = week.id;
    dto.weekNumber = week.weekNumber;
    dto.phase = week.phase;
    dto.mesocycleNumber = week.mesocycleNumber;
    dto.description = week.description;
    dto.isDeload = week.isDeload;
    dto.intensityModifier = week.intensityModifier;
    dto.volumeModifier = week.volumeModifier;
    dto.days = (week.days ?? [])
      .slice()
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .map(DayResponseDto.fromEntity);
    return dto;
  }
}

export class ProgramResponseDto {
  id!: string;
  userId!: string;
  name!: string;
  description!: string | null;
  status!: string;
  totalWeeks!: number;
  primaryGoal!: string;
  experienceLevel!: string;
  splitType!: string;
  weeklyDays!: number;
  isLowIntensityMode!: boolean;
  startedAt!: Date | null;
  completedAt!: Date | null;
  createdAt!: Date;
  weeks!: WeekResponseDto[];

  static fromEntity(program: TrainingProgram): ProgramResponseDto {
    const dto = new ProgramResponseDto();
    dto.id = program.id;
    dto.userId = program.userId;
    dto.name = program.name;
    dto.description = program.description;
    dto.status = program.status;
    dto.totalWeeks = program.totalWeeks;
    dto.primaryGoal = program.primaryGoal;
    dto.experienceLevel = program.experienceLevel;
    dto.splitType = program.splitType;
    dto.weeklyDays = program.weeklyDays;
    dto.isLowIntensityMode = program.isLowIntensityMode;
    dto.startedAt = program.startedAt;
    dto.completedAt = program.completedAt;
    dto.createdAt = program.createdAt;
    dto.weeks = (program.weeks ?? [])
      .slice()
      .sort((a, b) => a.weekNumber - b.weekNumber)
      .map(WeekResponseDto.fromEntity);
    return dto;
  }
}

/** Сокращённая версия программы — без вложенных недель, для списков. */
export class ProgramSummaryDto {
  id!: string;
  name!: string;
  status!: string;
  primaryGoal!: string;
  splitType!: string;
  weeklyDays!: number;
  startedAt!: Date | null;
  completedAt!: Date | null;
  createdAt!: Date;

  static fromEntity(p: TrainingProgram): ProgramSummaryDto {
    const dto = new ProgramSummaryDto();
    dto.id = p.id;
    dto.name = p.name;
    dto.status = p.status;
    dto.primaryGoal = p.primaryGoal;
    dto.splitType = p.splitType;
    dto.weeklyDays = p.weeklyDays;
    dto.startedAt = p.startedAt;
    dto.completedAt = p.completedAt;
    dto.createdAt = p.createdAt;
    return dto;
  }
}
