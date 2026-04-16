import {
  BodyweightGoal,
  DailyActivityLevel,
  EquipmentAccess,
  ExperienceLevel,
  Gender,
  InjuryFlag,
  PrimaryTrainingGoal,
  StressLevel,
  TechnicalConfidence,
} from '../../profile/enums';

/**
 * Вход TrainingEngine.generateProgram — чистые данные из ProfileModule.
 * Engine не ходит в БД, принимает всё параметром.
 */
export interface ProfileConfig {
  sex: Gender;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  waistCm?: number | null;

  experienceLevel: ExperienceLevel;
  currentTrainingDaysPerWeek: number;
  technicalConfidence?: TechnicalConfidence | null;

  baselineStrength?: {
    squatKg?: number | null;
    benchKg?: number | null;
    deadliftKg?: number | null;
    pullUpsMaxReps?: number | null;
  } | null;

  primaryTrainingGoal: PrimaryTrainingGoal;
  bodyweightGoal: BodyweightGoal;
  weeklyTrainingDaysTarget: number;
  sessionDurationMinutes: 30 | 45 | 60 | 75 | 90;

  equipmentAccess: EquipmentAccess;
  injuryPainFlags: InjuryFlag[];
  preScreeningRedFlags: boolean;

  sleepHoursAvg: number;
  stressLevel: StressLevel;
  dailyActivityLevel: DailyActivityLevel;
}
