import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  BodyweightGoal,
  DailyActivityLevel,
  DietaryRestriction,
  EquipmentAccess,
  ExperienceLevel,
  Gender,
  InjuryFlag,
  NutritionTier,
  PrimaryTrainingGoal,
  SESSION_DURATION_VALUES,
  StressLevel,
  TechnicalConfidence,
} from '../enums';
import { BaselineStrengthDto } from './baseline-strength.dto';

export class CreateProfileDto {
  // === physicalProfile ===

  @IsEnum(Gender)
  sex!: Gender;

  @IsInt()
  @Min(14)
  @Max(80)
  ageYears!: number;

  @IsNumber()
  @Min(100)
  @Max(230)
  heightCm!: number;

  @IsNumber()
  @Min(30)
  @Max(250)
  weightKg!: number;

  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(200)
  waistCm?: number;

  // === trainingExperience ===

  @IsEnum(ExperienceLevel)
  experienceLevel!: ExperienceLevel;

  @IsInt()
  @Min(0)
  @Max(7)
  currentTrainingDaysPerWeek!: number;

  @IsOptional()
  @IsEnum(TechnicalConfidence)
  technicalConfidence?: TechnicalConfidence;

  @IsOptional()
  @ValidateNested()
  @Type(() => BaselineStrengthDto)
  baselineStrengthOptional?: BaselineStrengthDto;

  // === goalDefinition ===

  @IsEnum(PrimaryTrainingGoal)
  primaryTrainingGoal!: PrimaryTrainingGoal;

  @IsEnum(BodyweightGoal)
  bodyweightGoal!: BodyweightGoal;

  @IsInt()
  @Min(2)
  @Max(6)
  weeklyTrainingDaysTarget!: number;

  @IsInt()
  @IsIn([...SESSION_DURATION_VALUES])
  sessionDurationMinutes!: 30 | 45 | 60 | 75 | 90;

  // === constraintsAndLimitations ===

  @IsEnum(EquipmentAccess)
  equipmentAccess!: EquipmentAccess;

  @IsArray()
  @IsEnum(InjuryFlag, { each: true })
  @ArrayUnique()
  injuryPainFlags!: InjuryFlag[];

  // === lifestyleFactors ===

  @IsNumber()
  @Min(3)
  @Max(12)
  sleepHoursAvg!: number;

  @IsEnum(StressLevel)
  stressLevel!: StressLevel;

  @IsEnum(DailyActivityLevel)
  dailyActivityLevel!: DailyActivityLevel;

  @IsEnum(NutritionTier)
  nutritionTierPreference!: NutritionTier;

  @IsOptional()
  @IsArray()
  @IsEnum(DietaryRestriction, { each: true })
  @ArrayUnique()
  dietaryRestrictions?: DietaryRestriction[];
}
