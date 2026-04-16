import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
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
} from './enums';

/**
 * Postgres DECIMAL драйвер возвращает строку — автоматически парсим в number.
 * Объявлен до класса, т.к. декораторы @Column исполняются eagerly при загрузке модуля.
 */
const decimalTransformer = {
  to: (value: number | null | undefined) => value,
  from: (value: string | null): number | null => (value === null ? null : parseFloat(value)),
};

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_profiles_user', { unique: true })
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  // === physicalProfile ===

  @Column({ type: 'varchar', length: 10 })
  sex!: Gender;

  @Column({ name: 'age_years', type: 'smallint' })
  ageYears!: number;

  @Column({ name: 'height_cm', type: 'decimal', precision: 5, scale: 1, transformer: decimalTransformer })
  heightCm!: number;

  @Column({ name: 'weight_kg', type: 'decimal', precision: 5, scale: 1, transformer: decimalTransformer })
  weightKg!: number;

  @Column({ name: 'waist_cm', type: 'decimal', precision: 5, scale: 1, nullable: true, transformer: decimalTransformer })
  waistCm!: number | null;

  // === trainingExperience ===

  @Column({ name: 'experience_level', type: 'varchar', length: 15 })
  experienceLevel!: ExperienceLevel;

  @Column({ name: 'current_training_days_per_week', type: 'smallint' })
  currentTrainingDaysPerWeek!: number;

  @Column({ name: 'technical_confidence', type: 'varchar', length: 10, nullable: true })
  technicalConfidence!: TechnicalConfidence | null;

  @Column({ name: 'baseline_squat_kg', type: 'decimal', precision: 5, scale: 1, nullable: true, transformer: decimalTransformer })
  baselineSquatKg!: number | null;

  @Column({ name: 'baseline_bench_kg', type: 'decimal', precision: 5, scale: 1, nullable: true, transformer: decimalTransformer })
  baselineBenchKg!: number | null;

  @Column({ name: 'baseline_deadlift_kg', type: 'decimal', precision: 5, scale: 1, nullable: true, transformer: decimalTransformer })
  baselineDeadliftKg!: number | null;

  @Column({ name: 'baseline_pullups_max', type: 'smallint', nullable: true })
  baselinePullupsMax!: number | null;

  // === goalDefinition ===

  @Column({ name: 'primary_training_goal', type: 'varchar', length: 20 })
  primaryTrainingGoal!: PrimaryTrainingGoal;

  @Column({ name: 'bodyweight_goal', type: 'varchar', length: 10 })
  bodyweightGoal!: BodyweightGoal;

  @Column({ name: 'weekly_training_days_target', type: 'smallint' })
  weeklyTrainingDaysTarget!: number;

  @Column({ name: 'session_duration_minutes', type: 'smallint' })
  sessionDurationMinutes!: number;

  // === constraintsAndLimitations ===

  @Column({ name: 'equipment_access', type: 'varchar', length: 20 })
  equipmentAccess!: EquipmentAccess;

  @Column({ name: 'injury_pain_flags', type: 'text', array: true, default: () => "'{}'" })
  injuryPainFlags!: InjuryFlag[];

  @Column({ name: 'pre_screening_red_flags', type: 'boolean', default: false })
  preScreeningRedFlags!: boolean;

  // === lifestyleFactors ===

  @Column({ name: 'sleep_hours_avg', type: 'decimal', precision: 3, scale: 1, transformer: decimalTransformer })
  sleepHoursAvg!: number;

  @Column({ name: 'stress_level', type: 'varchar', length: 10 })
  stressLevel!: StressLevel;

  @Column({ name: 'daily_activity_level', type: 'varchar', length: 15 })
  dailyActivityLevel!: DailyActivityLevel;

  @Column({ name: 'nutrition_tier_preference', type: 'varchar', length: 15 })
  nutritionTierPreference!: NutritionTier;

  @Column({ name: 'dietary_restrictions', type: 'text', array: true, default: () => "'{}'" })
  dietaryRestrictions!: DietaryRestriction[];

  // === derived (cached) ===

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true, transformer: decimalTransformer })
  bmi!: number | null;

  @Column({ type: 'integer', nullable: true })
  ree!: number | null;

  @Column({ type: 'integer', nullable: true })
  tdee!: number | null;

  @Column({ name: 'activity_factor', type: 'decimal', precision: 3, scale: 2, nullable: true, transformer: decimalTransformer })
  activityFactor!: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
