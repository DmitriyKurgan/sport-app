import { IsNumber, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';

export class CreateBodyMeasurementDto {
  @IsNumber()
  @Min(30)
  @Max(300)
  weightKg!: number;

  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(60)
  bodyFatPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(160)
  chestCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(200)
  waistCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(180)
  hipsCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(70)
  bicepsCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(100)
  thighCm?: number;

  @IsOptional()
  @IsString()
  @IsUrl()
  photoUrl?: string;
}
