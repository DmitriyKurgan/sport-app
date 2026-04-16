import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProgressLogDto {
  @IsUUID()
  exerciseId!: string;

  @IsOptional()
  @IsUUID()
  trainingDayId?: string;

  @IsOptional()
  @IsUUID()
  dayExerciseId?: string;

  @IsInt()
  @Min(1)
  @Max(20)
  setNumber!: number;

  @IsNumber()
  @Min(0)
  @Max(500)
  weightKg!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  reps!: number;

  /** Reps In Reserve — приоритетная шкала. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  rir?: number;

  /** RPE — альтернативная шкала (1–10, шаг 0.5 — но через @IsNumber). */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rpe?: number;

  @IsOptional()
  @IsBoolean()
  isWarmup?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
