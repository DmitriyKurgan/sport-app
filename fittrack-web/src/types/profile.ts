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
  SessionDuration,
  StressLevel,
  TechnicalConfidence,
} from './enums';

export interface BaselineStrength {
  squatKg?: number;
  benchKg?: number;
  deadliftKg?: number;
  pullUpsMaxReps?: number;
}

export interface CreateProfileRequest {
  // physical
  sex: Gender;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  waistCm?: number;

  // experience
  experienceLevel: ExperienceLevel;
  currentTrainingDaysPerWeek: number;
  technicalConfidence?: TechnicalConfidence;
  baselineStrengthOptional?: BaselineStrength;

  // goals
  primaryTrainingGoal: PrimaryTrainingGoal;
  bodyweightGoal: BodyweightGoal;
  weeklyTrainingDaysTarget: number;
  sessionDurationMinutes: SessionDuration;

  // constraints
  equipmentAccess: EquipmentAccess;
  injuryPainFlags: InjuryFlag[];

  // lifestyle
  sleepHoursAvg: number;
  stressLevel: StressLevel;
  dailyActivityLevel: DailyActivityLevel;
  nutritionTierPreference: NutritionTier;
  dietaryRestrictions?: DietaryRestriction[];
}

export type UpdateProfileRequest = Partial<CreateProfileRequest>;

export interface ProfileResponse extends CreateProfileRequest {
  id: string;
  userId: string;
  preScreeningRedFlags: boolean;
  baselineStrength: {
    squatKg: number | null;
    benchKg: number | null;
    deadliftKg: number | null;
    pullUpsMaxReps: number | null;
  };
  // derived
  bmi: number | null;
  ree: number | null;
  tdee: number | null;
  activityFactor: number | null;
  proteinTargetG: number | null;
  createdAt: string;
  updatedAt: string;
}
