import { IsEnum, IsOptional } from 'class-validator';

export type DayType = 'training_day' | 'rest_day' | 'heavy_training_day';

export class MealsQueryDto {
  @IsOptional()
  @IsEnum(['training_day', 'rest_day', 'heavy_training_day'])
  dayType?: DayType;
}
