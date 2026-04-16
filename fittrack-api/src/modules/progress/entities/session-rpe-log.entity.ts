import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalTransformer } from './_transformers';

/**
 * Лог общего session-RPE по тренировке.
 * Используется для расчёта internal_load (Foster et al).
 *   internal_load = sessionRPE × durationMinutes
 */
@Entity('session_rpe_logs')
@Index('idx_session_rpe_user', ['userId'])
@Index('idx_session_rpe_user_date', ['userId', 'recordedAt'])
export class SessionRPELog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'training_day_id', type: 'uuid' })
  trainingDayId!: string;

  @Column({
    name: 'session_rpe',
    type: 'decimal',
    precision: 3,
    scale: 1,
    transformer: decimalTransformer,
  })
  sessionRpe!: number;

  @Column({ name: 'duration_minutes', type: 'smallint' })
  durationMinutes!: number;

  @Column({
    name: 'internal_load',
    type: 'decimal',
    precision: 8,
    scale: 2,
    transformer: decimalTransformer,
  })
  internalLoad!: number;

  @CreateDateColumn({ name: 'recorded_at', type: 'timestamp' })
  recordedAt!: Date;
}
