import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { EquipmentAccess, InjuryFlag } from '../../profile/enums';
import { JointInvolvement, MovementPattern, MuscleGroup } from '../../training-engine/enums';

/**
 * Каталог упражнений. Общая таблица (shared между всеми пользователями).
 * TrainingEngine читает её через ExerciseService и получает ExerciseCatalogItem.
 */
@Entity('exercises')
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_exercises_slug', { unique: true })
  @Column({ type: 'varchar', length: 60 })
  slug!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'name_ru', type: 'varchar', length: 100, nullable: true })
  nameRu!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'movement_patterns', type: 'text', array: true })
  movementPatterns!: MovementPattern[];

  @Column({ name: 'primary_muscles', type: 'text', array: true })
  primaryMuscles!: MuscleGroup[];

  @Column({ name: 'secondary_muscles', type: 'text', array: true, default: () => "'{}'" })
  secondaryMuscles!: MuscleGroup[];

  @Column({ name: 'joint_involvement', type: 'text', array: true })
  jointInvolvement!: JointInvolvement[];

  @Column({ name: 'contraindications', type: 'text', array: true, default: () => "'{}'" })
  contraindications!: InjuryFlag[];

  @Column({ name: 'equipment_required', type: 'text', array: true })
  equipmentRequired!: string[];

  @Column({ name: 'equipment_access_min', type: 'varchar', length: 20 })
  equipmentAccessMin!: EquipmentAccess;

  @Column({ type: 'smallint' })
  difficulty!: 1 | 2 | 3 | 4 | 5;

  @Column({ name: 'technical_demand', type: 'varchar', length: 10 })
  technicalDemand!: 'low' | 'medium' | 'high';

  @Column({ name: 'progression_chain', type: 'text', array: true, nullable: true })
  progressionChain!: string[] | null;

  @Column({ name: 'progression_order', type: 'smallint', nullable: true })
  progressionOrder!: number | null;

  @Column({ type: 'text', nullable: true })
  instructions!: string | null;

  @Column({ name: 'video_url', type: 'varchar', length: 500, nullable: true })
  videoUrl!: string | null;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
