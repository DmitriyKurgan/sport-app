// Зеркальные enum'ы из backend для типизации DTO.
// Держим в sync с fittrack-api/src/modules/profile/enums + training-engine/enums.

export type Gender = 'male' | 'female';

export type ExperienceLevel = 'none' | 'novice' | 'intermediate';

export type PrimaryTrainingGoal =
  | 'strength'
  | 'hypertrophy'
  | 'fitness'
  | 'endurance_mixed'
  | 'sport_prep';

export type BodyweightGoal = 'cut' | 'maintain' | 'bulk';

export type SessionDuration = 30 | 45 | 60 | 75 | 90;

export type EquipmentAccess =
  | 'bodyweight'
  | 'home_dumbbells'
  | 'gym'
  | 'advanced_gym';

export type InjuryFlag =
  | 'shoulder'
  | 'knee'
  | 'hip'
  | 'lower_back'
  | 'neck'
  | 'wrist'
  | 'ankle'
  | 'none';

export type TechnicalConfidence = 'low' | 'medium' | 'high';
export type StressLevel = 'low' | 'medium' | 'high';
export type DailyActivityLevel = 'sedentary' | 'moderate' | 'active';
export type NutritionTier = 'budget' | 'standard' | 'advanced';

export type DietaryRestriction =
  | 'vegetarian'
  | 'vegan'
  | 'halal'
  | 'kosher'
  | 'lactose_intolerance'
  | 'gluten_free'
  | 'none';

export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'horizontal_push'
  | 'horizontal_pull'
  | 'vertical_push'
  | 'vertical_pull'
  | 'carry'
  | 'core'
  | 'lunge'
  | 'isolation';

export type ExerciseRole = 'main_lift' | 'accessory' | 'finisher' | 'warmup';

export type ProgramPhase =
  | 'adaptation'
  | 'accumulation'
  | 'intensification'
  | 'deload';

export type SplitType =
  | 'full_body'
  | 'upper_lower'
  | 'upper_lower_plus'
  | 'ppl'
  | 'low_intensity';

export type AlertType =
  | 'plateau_strength'
  | 'regression'
  | 'weight_plateau_cut'
  | 'overtraining';

export type AlertSeverity = 'info' | 'warning' | 'critical';
