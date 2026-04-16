import { EquipmentAccess, InjuryFlag } from '../../profile/enums';
import {
  JointInvolvement,
  MovementPattern,
  MuscleGroup,
} from '../enums';

/**
 * Данные об упражнении, необходимые TrainingEngine.
 * Это view для чистой логики — entity в БД может иметь больше полей.
 */
export interface ExerciseCatalogItem {
  id: string;
  slug: string;
  name: string;
  nameRu?: string | null;
  movementPatterns: MovementPattern[];
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  jointInvolvement: JointInvolvement[];
  contraindications: InjuryFlag[];
  equipmentRequired: string[];
  equipmentAccessMin: EquipmentAccess;
  difficulty: 1 | 2 | 3 | 4 | 5;
  technicalDemand: 'low' | 'medium' | 'high';
  progressionChain?: string[] | null;
  progressionOrder?: number | null;
}
