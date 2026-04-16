import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class BaselineStrengthDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  squatKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  benchKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  deadliftKg?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  pullUpsMaxReps?: number;
}
