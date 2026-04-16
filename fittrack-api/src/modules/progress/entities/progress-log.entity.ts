import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalTransformer } from './_transformers';

/**
 * Лог одного выполненного подхода.
 *
 * Поля e1RM и volume_load — кэшированные значения для аналитики
 * (рассчитываются в сервисе при сохранении из weight × reps).
 */
@Entity('progress_logs')
@Index('idx_progress_user', ['userId'])
@Index('idx_progress_user_exercise', ['userId', 'exerciseId'])
@Index('idx_progress_user_date', ['userId', 'performedAt'])
@Index('idx_progress_day', ['trainingDayId'])
export class ProgressLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'exercise_id', type: 'uuid' })
  exerciseId!: string;

  @Column({ name: 'training_day_id', type: 'uuid', nullable: true })
  trainingDayId!: string | null;

  @Column({ name: 'day_exercise_id', type: 'uuid', nullable: true })
  dayExerciseId!: string | null;

  @Column({ name: 'set_number', type: 'smallint' })
  setNumber!: number;

  @Column({ name: 'weight_kg', type: 'decimal', precision: 6, scale: 2, transformer: decimalTransformer })
  weightKg!: number;

  @Column({ type: 'smallint' })
  reps!: number;

  /** Reps In Reserve (0–5). Приоритетный для авторегуляции. */
  @Column({ type: 'smallint', nullable: true })
  rir!: number | null;

  /** Rate of Perceived Exertion (1–10). Альтернативная шкала. */
  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true, transformer: decimalTransformer })
  rpe!: number | null;

  /** Estimated 1RM по Эпли — кэш для графиков прогресса силы. */
  @Column({
    name: 'estimated_1rm',
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  estimated1rm!: number | null;

  /** Volume load = weight × reps (если не warmup) — кэш для агрегации. */
  @Column({
    name: 'volume_load',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  volumeLoad!: number | null;

  @Column({ name: 'is_warmup', type: 'boolean', default: false })
  isWarmup!: boolean;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'performed_at', type: 'timestamp', default: () => 'NOW()' })
  performedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
