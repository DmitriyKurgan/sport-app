import { BodyweightGoal, DietaryRestriction, NutritionTier, ProgramPhase } from './enums';

export type MealType =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'pre_workout'
  | 'post_workout';

export type DayTemplate = 'training_day' | 'rest_day' | 'heavy_training_day';

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface MealTemplate {
  id: string;
  slug: string;
  name: string;
  tier: NutritionTier;
  mealType: MealType;
  dayTemplate: DayTemplate;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  ingredients: Ingredient[];
  instructions: string | null;
  dietaryTags: DietaryRestriction[];
}

export interface PlannedMeal {
  orderIndex: number;
  dayType: DayTemplate;
  template: MealTemplate;
}

export interface SupplementInfo {
  name: string;
  dose: string;
  notes?: string;
}

export interface NutritionPlan {
  id: string;
  userId: string;
  tier: NutritionTier;
  bodyweightGoal: BodyweightGoal;
  currentPhase: ProgramPhase | null;
  caloriesTarget: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  proteinPerMealG: number;
  mealsPerDay: number;
  supplements: SupplementInfo[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  meals: PlannedMeal[];
}

export interface UpdatePlanRequest {
  tier?: NutritionTier;
}

export interface RecalibrateRequest {
  trendDeltaKg: number;
}
