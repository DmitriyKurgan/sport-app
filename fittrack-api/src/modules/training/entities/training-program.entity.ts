import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExperienceLevel, PrimaryTrainingGoal } from '../../profile/enums';
import { SplitType } from '../../training-engine/enums';
import { TrainingWeek } from './training-week.entity';

export type ProgramStatus = 'active' | 'completed' | 'abandoned';

@Entity('training_programs')
@Index('idx_programs_user', ['userId'])
export class TrainingProgram {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 15, default: 'active' })
  status!: ProgramStatus;

  @Column({ name: 'total_weeks', type: 'smallint', default: 12 })
  totalWeeks!: number;

  @Column({ name: 'primary_goal', type: 'varchar', length: 20 })
  primaryGoal!: PrimaryTrainingGoal;

  @Column({ name: 'experience_level', type: 'varchar', length: 15 })
  experienceLevel!: ExperienceLevel;

  @Column({ name: 'split_type', type: 'varchar', length: 30 })
  splitType!: SplitType;

  @Column({ name: 'weekly_days', type: 'smallint' })
  weeklyDays!: number;

  @Column({ name: 'is_low_intensity_mode', type: 'boolean', default: false })
  isLowIntensityMode!: boolean;

  @Column({ name: 'config_snapshot', type: 'jsonb', nullable: true })
  configSnapshot!: Record<string, unknown> | null;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => TrainingWeek, (week) => week.program, { cascade: true })
  weeks!: TrainingWeek[];
}
