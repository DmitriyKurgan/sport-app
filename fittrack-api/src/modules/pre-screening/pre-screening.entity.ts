import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ParqAnswers = Record<string, boolean>;

@Entity('pre_screenings')
@Index('idx_screenings_user', ['userId'])
@Index('idx_screenings_user_date', ['userId', 'createdAt'])
export class PreScreening {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'jsonb' })
  answers!: ParqAnswers;

  @Column({ name: 'red_flags', type: 'boolean' })
  redFlags!: boolean;

  @Column({
    name: 'red_flag_reasons',
    type: 'text',
    array: true,
    default: () => "'{}'",
  })
  redFlagReasons!: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
