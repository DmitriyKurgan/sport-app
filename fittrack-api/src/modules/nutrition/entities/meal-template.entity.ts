import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { DietaryRestriction, NutritionTier } from '../../profile/enums';
import { decimalTransformer } from './_transformers';

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
  unit: string; // 'g', 'ml', 'шт.', 'стакан'
}

/**
 * Общий каталог шаблонов меню.
 * NutritionService.selectMealTemplates выбирает комбинацию под цели пользователя.
 */
@Entity('meal_templates')
@Index('idx_meal_templates_tier_type', ['tier', 'mealType'])
@Index('idx_meal_templates_dietary', ['dietaryTags'])
export class MealTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_meal_templates_slug', { unique: true })
  @Column({ type: 'varchar', length: 60 })
  slug!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 15 })
  tier!: NutritionTier;

  @Column({ name: 'meal_type', type: 'varchar', length: 15 })
  mealType!: MealType;

  @Column({ name: 'day_template', type: 'varchar', length: 25 })
  dayTemplate!: DayTemplate;

  @Column({ type: 'smallint' })
  calories!: number;

  @Column({ name: 'protein_g', type: 'decimal', precision: 5, scale: 1, transformer: decimalTransformer })
  proteinG!: number;

  @Column({ name: 'fat_g', type: 'decimal', precision: 5, scale: 1, transformer: decimalTransformer })
  fatG!: number;

  @Column({ name: 'carbs_g', type: 'decimal', precision: 5, scale: 1, transformer: decimalTransformer })
  carbsG!: number;

  @Column({ type: 'jsonb' })
  ingredients!: Ingredient[];

  @Column({ type: 'text', nullable: true })
  instructions!: string | null;

  @Column({ name: 'dietary_tags', type: 'text', array: true, default: () => "'{}'" })
  dietaryTags!: DietaryRestriction[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
