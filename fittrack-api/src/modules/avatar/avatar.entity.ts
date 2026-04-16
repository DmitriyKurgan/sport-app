import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

const decimalTransformer = {
  to: (v: number | null | undefined) => v,
  from: (v: string | null): number | null => (v === null ? null : parseFloat(v)),
};

@Entity('avatar_snapshots')
@Index('idx_avatar_user_date', ['userId', 'createdAt'])
export class AvatarSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'height_scale', type: 'decimal', precision: 4, scale: 3, transformer: decimalTransformer })
  heightScale!: number;

  @Column({ name: 'shoulder_width', type: 'decimal', precision: 4, scale: 3, transformer: decimalTransformer })
  shoulderWidth!: number;

  @Column({ name: 'chest_depth', type: 'decimal', precision: 4, scale: 3, transformer: decimalTransformer })
  chestDepth!: number;

  @Column({ name: 'waist_width', type: 'decimal', precision: 4, scale: 3, transformer: decimalTransformer })
  waistWidth!: number;

  @Column({ name: 'hip_width', type: 'decimal', precision: 4, scale: 3, transformer: decimalTransformer })
  hipWidth!: number;

  @Column({ name: 'arm_girth', type: 'decimal', precision: 4, scale: 3, transformer: decimalTransformer })
  armGirth!: number;

  @Column({ name: 'thigh_girth', type: 'decimal', precision: 4, scale: 3, transformer: decimalTransformer })
  thighGirth!: number;

  @Column({ name: 'muscle_definition', type: 'decimal', precision: 3, scale: 2, transformer: decimalTransformer })
  muscleDefinition!: number;

  @Column({ name: 'body_fat_layer', type: 'decimal', precision: 3, scale: 2, transformer: decimalTransformer })
  bodyFatLayer!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
