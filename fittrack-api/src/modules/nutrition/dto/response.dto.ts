import {
  Ingredient,
  MealTemplate,
  MealType,
  NutritionPlan,
  NutritionPlanMeal,
  SupplementInfo,
} from '../entities';
import { DayType } from './meals-query.dto';

export class MealTemplateDto {
  id!: string;
  slug!: string;
  name!: string;
  tier!: string;
  mealType!: MealType;
  dayTemplate!: string;
  calories!: number;
  proteinG!: number;
  fatG!: number;
  carbsG!: number;
  ingredients!: Ingredient[];
  instructions!: string | null;
  dietaryTags!: string[];

  static fromEntity(mt: MealTemplate): MealTemplateDto {
    const dto = new MealTemplateDto();
    dto.id = mt.id;
    dto.slug = mt.slug;
    dto.name = mt.name;
    dto.tier = mt.tier;
    dto.mealType = mt.mealType;
    dto.dayTemplate = mt.dayTemplate;
    dto.calories = mt.calories;
    dto.proteinG = mt.proteinG;
    dto.fatG = mt.fatG;
    dto.carbsG = mt.carbsG;
    dto.ingredients = mt.ingredients;
    dto.instructions = mt.instructions;
    dto.dietaryTags = mt.dietaryTags;
    return dto;
  }
}

export class PlannedMealDto {
  orderIndex!: number;
  dayType!: DayType;
  template!: MealTemplateDto;

  static fromEntity(npm: NutritionPlanMeal): PlannedMealDto {
    const dto = new PlannedMealDto();
    dto.orderIndex = npm.orderIndex;
    dto.dayType = npm.dayType;
    dto.template = MealTemplateDto.fromEntity(npm.template);
    return dto;
  }
}

export class NutritionPlanResponseDto {
  id!: string;
  userId!: string;
  tier!: string;
  bodyweightGoal!: string;
  currentPhase!: string | null;
  caloriesTarget!: number;
  proteinG!: number;
  fatG!: number;
  carbsG!: number;
  proteinPerMealG!: number;
  mealsPerDay!: number;
  supplements!: SupplementInfo[] | null;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  meals!: PlannedMealDto[];

  static fromEntity(plan: NutritionPlan): NutritionPlanResponseDto {
    const dto = new NutritionPlanResponseDto();
    dto.id = plan.id;
    dto.userId = plan.userId;
    dto.tier = plan.tier;
    dto.bodyweightGoal = plan.bodyweightGoal;
    dto.currentPhase = plan.currentPhase;
    dto.caloriesTarget = plan.caloriesTarget;
    dto.proteinG = plan.proteinG;
    dto.fatG = plan.fatG;
    dto.carbsG = plan.carbsG;
    dto.proteinPerMealG = plan.proteinPerMealG;
    dto.mealsPerDay = plan.mealsPerDay;
    dto.supplements = plan.supplements;
    dto.isActive = plan.isActive;
    dto.createdAt = plan.createdAt;
    dto.updatedAt = plan.updatedAt;
    dto.meals = (plan.meals ?? [])
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(PlannedMealDto.fromEntity);
    return dto;
  }
}
