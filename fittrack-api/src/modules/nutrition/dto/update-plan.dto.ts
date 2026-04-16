import { IsEnum, IsOptional } from 'class-validator';
import { NutritionTier } from '../../profile/enums';

export class UpdatePlanDto {
  /** Смена тира — вызывает перегенерацию меню. */
  @IsOptional()
  @IsEnum(NutritionTier)
  tier?: NutritionTier;
}
