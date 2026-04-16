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
import { ProgramPhase } from '../../training-engine/enums';
import { decimalTransformer } from './_transformers';
import { TrainingDay } from './training-day.entity';
import { TrainingProgram } from './training-program.entity';

@Entity('training_weeks')
@Index('idx_weeks_program', ['programId'])
@Index('idx_weeks_program_number', ['programId', 'weekNumber'], { unique: true })
export class TrainingWeek {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'program_id', type: 'uuid' })
  programId!: string;

  @Column({ name: 'week_number', type: 'smallint' })
  weekNumber!: number;

  @Column({ type: 'varchar', length: 20 })
  phase!: ProgramPhase;

  @Column({ name: 'mesocycle_number', type: 'smallint' })
  mesocycleNumber!: 1 | 2 | 3;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Column({ name: 'is_deload', type: 'boolean', default: false })
  isDeload!: boolean;

  @Column({
    name: 'intensity_modifier',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 1.0,
    transformer: decimalTransformer,
  })
  intensityModifier!: number;

  @Column({
    name: 'volume_modifier',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 1.0,
    transformer: decimalTransformer,
  })
  volumeModifier!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => TrainingProgram, (program) => program.weeks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'program_id' })
  program!: TrainingProgram;

  @OneToMany(() => TrainingDay, (day) => day.week, { cascade: true })
  days!: TrainingDay[];
}
