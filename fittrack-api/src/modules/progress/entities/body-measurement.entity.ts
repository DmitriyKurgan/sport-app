import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalTransformer } from './_transformers';

@Entity('body_measurements')
@Index('idx_measurements_user', ['userId'])
@Index('idx_measurements_user_date', ['userId', 'measuredAt'])
export class BodyMeasurement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'weight_kg', type: 'decimal', precision: 5, scale: 1, transformer: decimalTransformer })
  weightKg!: number;

  @Column({
    name: 'body_fat_percent',
    type: 'decimal',
    precision: 4,
    scale: 1,
    nullable: true,
    transformer: decimalTransformer,
  })
  bodyFatPercent!: number | null;

  @Column({ name: 'chest_cm', type: 'decimal', precision: 5, scale: 1, nullable: true, transformer: decimalTransformer })
  chestCm!: number | null;

  @Column({ name: 'waist_cm', type: 'decimal', precision: 5, scale: 1, nullable: true, transformer: decimalTransformer })
  waistCm!: number | null;

  @Column({ name: 'hips_cm', type: 'decimal', precision: 5, scale: 1, nullable: true, transformer: decimalTransformer })
  hipsCm!: number | null;

  @Column({ name: 'biceps_cm', type: 'decimal', precision: 4, scale: 1, nullable: true, transformer: decimalTransformer })
  bicepsCm!: number | null;

  @Column({ name: 'thigh_cm', type: 'decimal', precision: 5, scale: 1, nullable: true, transformer: decimalTransformer })
  thighCm!: number | null;

  @Column({ name: 'photo_url', type: 'varchar', length: 500, nullable: true })
  photoUrl!: string | null;

  @Column({ name: 'measured_at', type: 'timestamp', default: () => 'NOW()' })
  measuredAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
