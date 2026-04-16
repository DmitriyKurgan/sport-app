import { Profile } from '../profile.entity';
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
  StressLevel,
  TechnicalConfidence,
} from '../enums';

export class ProfileResponseDto {
  id!: string;
  userId!: string;

  // physical
  sex!: Gender;
  ageYears!: number;
  heightCm!: number;
  weightKg!: number;
  waistCm!: number | null;

  // experience
  experienceLevel!: ExperienceLevel;
  currentTrainingDaysPerWeek!: number;
  technicalConfidence!: TechnicalConfidence | null;
  baselineStrength!: {
    squatKg: number | null;
    benchKg: number | null;
    deadliftKg: number | null;
    pullUpsMaxReps: number | null;
  };

  // goal
  primaryTrainingGoal!: PrimaryTrainingGoal;
  bodyweightGoal!: BodyweightGoal;
  weeklyTrainingDaysTarget!: number;
  sessionDurationMinutes!: number;

  // constraints
  equipmentAccess!: EquipmentAccess;
  injuryPainFlags!: InjuryFlag[];
  preScreeningRedFlags!: boolean;

  // lifestyle
  sleepHoursAvg!: number;
  stressLevel!: StressLevel;
  dailyActivityLevel!: DailyActivityLevel;
  nutritionTierPreference!: NutritionTier;
  dietaryRestrictions!: DietaryRestriction[];

  // derived
  bmi!: number | null;
  ree!: number | null;
  tdee!: number | null;
  activityFactor!: number | null;
  proteinTargetG!: number | null;

  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(entity: Profile, proteinTargetG: number | null): ProfileResponseDto {
    const dto = new ProfileResponseDto();
    dto.id = entity.id;
    dto.userId = entity.userId;

    dto.sex = entity.sex;
    dto.ageYears = entity.ageYears;
    dto.heightCm = entity.heightCm;
    dto.weightKg = entity.weightKg;
    dto.waistCm = entity.waistCm;

    dto.experienceLevel = entity.experienceLevel;
    dto.currentTrainingDaysPerWeek = entity.currentTrainingDaysPerWeek;
    dto.technicalConfidence = entity.technicalConfidence;
    dto.baselineStrength = {
      squatKg: entity.baselineSquatKg,
      benchKg: entity.baselineBenchKg,
      deadliftKg: entity.baselineDeadliftKg,
      pullUpsMaxReps: entity.baselinePullupsMax,
    };

    dto.primaryTrainingGoal = entity.primaryTrainingGoal;
    dto.bodyweightGoal = entity.bodyweightGoal;
    dto.weeklyTrainingDaysTarget = entity.weeklyTrainingDaysTarget;
    dto.sessionDurationMinutes = entity.sessionDurationMinutes;

    dto.equipmentAccess = entity.equipmentAccess;
    dto.injuryPainFlags = entity.injuryPainFlags;
    dto.preScreeningRedFlags = entity.preScreeningRedFlags;

    dto.sleepHoursAvg = entity.sleepHoursAvg;
    dto.stressLevel = entity.stressLevel;
    dto.dailyActivityLevel = entity.dailyActivityLevel;
    dto.nutritionTierPreference = entity.nutritionTierPreference;
    dto.dietaryRestrictions = entity.dietaryRestrictions;

    dto.bmi = entity.bmi;
    dto.ree = entity.ree;
    dto.tdee = entity.tdee;
    dto.activityFactor = entity.activityFactor;
    dto.proteinTargetG = proteinTargetG;

    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
