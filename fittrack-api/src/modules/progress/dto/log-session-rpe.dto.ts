import { IsInt, IsNumber, IsUUID, Max, Min } from 'class-validator';

export class LogSessionRPEDto {
  @IsUUID()
  trainingDayId!: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  sessionRpe!: number;

  @IsInt()
  @Min(5)
  @Max(240)
  durationMinutes!: number;
}
