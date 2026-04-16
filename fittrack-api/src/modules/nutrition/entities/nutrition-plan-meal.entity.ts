import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DayTemplate, MealTemplate } from './meal-template.entity';
import { NutritionPlan } from './nutrition-plan.entity';

/**
 * M:N связь NutritionPlan ↔ MealTemplate с привязкой к типу дня и порядку.
 */
@Entity('nutrition_plan_meals')
@Index('idx_npm_plan', ['planId'])
export class NutritionPlanMeal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId!: string;

  @Column({ name: 'template_id', type: 'uuid' })
  templateId!: string;

  @Column({ name: 'day_type', type: 'varchar', length: 25 })
  dayType!: DayTemplate;

  @Column({ name: 'order_index', type: 'smallint' })
  orderIndex!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => NutritionPlan, (plan) => plan.meals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan!: NutritionPlan;

  @ManyToOne(() => MealTemplate, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'template_id' })
  template!: MealTemplate;
}
