import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BodyweightGoal, NutritionTier } from '../../profile/enums';
import { ProgramPhase } from '../../training-engine/enums';
import { NutritionPlanMeal } from './nutrition-plan-meal.entity';

export interface SupplementInfo {
  name: string;
  dose: string;
  notes?: string;
}

@Entity('nutrition_plans')
@Index('idx_nutrition_user', ['userId'])
@Index('idx_nutrition_user_active', ['userId'], { where: '"is_active" = true' })
export class NutritionPlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 15 })
  tier!: NutritionTier;

  @Column({ name: 'bodyweight_goal', type: 'varchar', length: 10 })
  bodyweightGoal!: BodyweightGoal;

  @Column({ name: 'current_phase', type: 'varchar', length: 20, nullable: true })
  currentPhase!: ProgramPhase | null;

  @Column({ name: 'calories_target', type: 'smallint' })
  caloriesTarget!: number;

  @Column({ name: 'protein_g', type: 'smallint' })
  proteinG!: number;

  @Column({ name: 'fat_g', type: 'smallint' })
  fatG!: number;

  @Column({ name: 'carbs_g', type: 'smallint' })
  carbsG!: number;

  @Column({ name: 'protein_per_meal_g', type: 'smallint' })
  proteinPerMealG!: number;

  @Column({ name: 'meals_per_day', type: 'smallint', default: 4 })
  mealsPerDay!: number;

  @Column({ type: 'jsonb', nullable: true })
  supplements!: SupplementInfo[] | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => NutritionPlanMeal, (npm) => npm.plan, { cascade: true })
  meals!: NutritionPlanMeal[];
}
