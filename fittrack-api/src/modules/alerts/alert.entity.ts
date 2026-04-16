import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type AlertType =
  | 'plateau_strength'
  | 'regression'
  | 'weight_plateau_cut'
  | 'overtraining';

export type AlertSeverity = 'info' | 'warning' | 'critical';

@Entity('alerts')
@Index('idx_alerts_user_active', ['userId'], { where: '"dismissed_at" IS NULL' })
@Index('idx_alerts_user_type', ['userId', 'type'])
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 30 })
  type!: AlertType;

  @Column({ type: 'varchar', length: 10 })
  severity!: AlertSeverity;

  @Column({ type: 'varchar', length: 100 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'text' })
  recommendation!: string;

  /** JSON-данные для UI и/или actOn (например, exerciseId, weeks). */
  @Column({ type: 'jsonb', nullable: true })
  context!: Record<string, unknown> | null;

  @Column({ name: 'triggered_at', type: 'timestamp', default: () => 'NOW()' })
  triggeredAt!: Date;

  @Column({ name: 'dismissed_at', type: 'timestamp', nullable: true })
  dismissedAt!: Date | null;

  @Column({ name: 'acted_upon', type: 'boolean', default: false })
  actedUpon!: boolean;

  @Column({ name: 'acted_at', type: 'timestamp', nullable: true })
  actedAt!: Date | null;
}
