import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ExerciseRole } from '../../training-engine/enums';
import { decimalTransformer } from './_transformers';
import { Exercise } from './exercise.entity';
import { TrainingDay } from './training-day.entity';

@Entity('training_day_exercises')
@Index('idx_day_exercises_day', ['dayId'])
@Index('idx_day_exercises_order', ['dayId', 'orderIndex'], { unique: true })
export class TrainingDayExercise {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'day_id', type: 'uuid' })
  dayId!: string;

  @Column({ name: 'exercise_id', type: 'uuid' })
  exerciseId!: string;

  @Column({ type: 'varchar', length: 15 })
  role!: ExerciseRole;

  @Column({ name: 'order_index', type: 'smallint' })
  orderIndex!: number;

  @Column({ type: 'smallint' })
  sets!: number;

  @Column({ name: 'reps_min', type: 'smallint' })
  repsMin!: number;

  @Column({ name: 'reps_max', type: 'smallint' })
  repsMax!: number;

  @Column({ name: 'target_rir', type: 'smallint', nullable: true })
  targetRir!: number | null;

  @Column({
    name: 'target_load_kg',
    type: 'decimal',
    precision: 5,
    scale: 1,
    nullable: true,
    transformer: decimalTransformer,
  })
  targetLoadKg!: number | null;

  @Column({
    name: 'load_pct_e1rm',
    type: 'decimal',
    precision: 4,
    scale: 1,
    nullable: true,
    transformer: decimalTransformer,
  })
  loadPctE1rm!: number | null;

  @Column({ name: 'rest_seconds', type: 'smallint', default: 90 })
  restSeconds!: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  tempo!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => TrainingDay, (day) => day.exercises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'day_id' })
  day!: TrainingDay;

  @ManyToOne(() => Exercise, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'exercise_id' })
  exercise!: Exercise;
}
