import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BodyComponent, BodyType, ClassificationConfidence } from './interfaces';

/**
 * Снимок numeric scoring телосложения в момент времени.
 * Создаётся при каждом пересчёте (обновление профиля, новые замеры, прогресс).
 * История нужна для трендов и для AvatarModule.
 */

const decimalTransformer = {
  to: (v: number | null | undefined) => v,
  from: (v: string | null): number | null => (v === null ? null : parseFloat(v)),
};

@Entity('body_type_snapshots')
@Index('idx_body_type_user_date', ['userId', 'createdAt'])
export class BodyTypeSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'adiposity_score', type: 'decimal', precision: 4, scale: 2, transformer: decimalTransformer })
  adiposityScore!: number;

  @Column({ name: 'muscularity_score', type: 'decimal', precision: 4, scale: 2, transformer: decimalTransformer })
  muscularityScore!: number;

  @Column({ name: 'linearity_score', type: 'decimal', precision: 4, scale: 2, transformer: decimalTransformer })
  linearityScore!: number;

  @Column({ type: 'varchar', length: 15 })
  classification!: BodyType;

  @Column({ name: 'dominant_components', type: 'text', array: true, default: () => "'{}'" })
  dominantComponents!: BodyComponent[];

  @Column({ type: 'varchar', length: 10 })
  confidence!: ClassificationConfidence;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
