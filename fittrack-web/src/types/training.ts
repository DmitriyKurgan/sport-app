import {
  EquipmentAccess,
  ExerciseRole,
  ExperienceLevel,
  InjuryFlag,
  MovementPattern,
  PrimaryTrainingGoal,
  ProgramPhase,
  SplitType,
} from './enums';

export interface ExerciseCatalogItem {
  id: string;
  slug: string;
  name: string;
  nameRu: string | null;
  description: string | null;
  movementPatterns: MovementPattern[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipmentRequired: string[];
  equipmentAccessMin: EquipmentAccess;
  difficulty: 1 | 2 | 3 | 4 | 5;
  technicalDemand: 'low' | 'medium' | 'high';
  videoUrl: string | null;
  videoSearchUrl: string;
  imageUrl: string | null;
}

export interface ExerciseCatalogResponse {
  exercises: ExerciseCatalogItem[];
  total: number;
}

export interface CatalogQuery {
  patterns?: MovementPattern[];
  muscles?: string[];
  equipmentAccess?: EquipmentAccess;
  difficultyMin?: number;
  difficultyMax?: number;
  limit?: number;
}

export interface DayExercise {
  id: string;
  exerciseId: string;
  exerciseSlug: string;
  exerciseName: string;
  videoSearchUrl: string;
  role: ExerciseRole;
  orderIndex: number;
  sets: number;
  repsMin: number;
  repsMax: number;
  targetRir: number | null;
  targetLoadKg: number | null;
  loadPctE1rm: number | null;
  restSeconds: number;
  tempo: string | null;
  notes: string | null;
}

export interface TrainingDay {
  id: string;
  dayNumber: number;
  name: string;
  description: string | null;
  targetMuscles: string[];
  isRestDay: boolean;
  startedAt: string | null;
  completedAt: string | null;
  exercises: DayExercise[];
}

export interface TrainingWeek {
  id: string;
  weekNumber: number;
  phase: ProgramPhase;
  mesocycleNumber: number;
  description: string | null;
  isDeload: boolean;
  intensityModifier: number;
  volumeModifier: number;
  days: TrainingDay[];
}

export interface TrainingProgram {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: 'active' | 'completed' | 'abandoned';
  totalWeeks: number;
  primaryGoal: PrimaryTrainingGoal;
  experienceLevel: ExperienceLevel;
  splitType: SplitType;
  weeklyDays: number;
  isLowIntensityMode: boolean;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  weeks: TrainingWeek[];
}

export interface TrainingProgramSummary {
  id: string;
  name: string;
  status: string;
  primaryGoal: PrimaryTrainingGoal;
  splitType: SplitType;
  weeklyDays: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}
