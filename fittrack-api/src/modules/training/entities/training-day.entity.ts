import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TrainingDayExercise } from './training-day-exercise.entity';
import { TrainingWeek } from './training-week.entity';

@Entity('training_days')
@Index('idx_days_week', ['weekId'])
@Index('idx_days_week_number', ['weekId', 'dayNumber'], { unique: true })
export class TrainingDay {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'week_id', type: 'uuid' })
  weekId!: string;

  @Column({ name: 'day_number', type: 'smallint' })
  dayNumber!: number;

  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'target_muscles', type: 'text', array: true, default: () => "'{}'" })
  targetMuscles!: string[];

  @Column({ name: 'is_rest_day', type: 'boolean', default: false })
  isRestDay!: boolean;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => TrainingWeek, (week) => week.days, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'week_id' })
  week!: TrainingWeek;

  @OneToMany(() => TrainingDayExercise, (dayEx) => dayEx.day, { cascade: true })
  exercises!: TrainingDayExercise[];
}
