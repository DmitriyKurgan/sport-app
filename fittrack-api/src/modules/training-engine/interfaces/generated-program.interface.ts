import { ExperienceLevel, PrimaryTrainingGoal } from '../../profile/enums';
import {
  ExerciseRole,
  MovementPattern,
  ProgramPhase,
  SplitType,
} from '../enums';

export interface GeneratedExercise {
  exerciseId: string;
  exerciseSlug: string; // для читаемости и тестов
  role: ExerciseRole;
  orderIndex: number;
  sets: number;
  repsMin: number;
  repsMax: number;
  targetRIR: number;        // 1-5, default для autoreg mode
  targetLoadKg?: number | null;
  loadPctE1RM?: number | null;
  restSeconds: number;
  tempo?: string | null;
  notes?: string | null;
}

export interface GeneratedDay {
  dayNumber: number;
  name: string;              // "Full Body A" | "Upper A" | "Push"
  splitTag: string;          // "full_body_A" | "upper_a" | "push_a"
  targetPatterns: MovementPattern[];
  isRestDay: boolean;
  exercises: GeneratedExercise[];
}

export interface GeneratedWeek {
  weekNumber: number;        // 1..12
  phase: ProgramPhase;
  mesocycleNumber: 1 | 2 | 3;
  intensityModifier: number;
  volumeModifier: number;
  isDeload: boolean;
  description: string;
  days: GeneratedDay[];
}

export interface GeneratedProgram {
  name: string;
  totalWeeks: 12;
  primaryGoal: PrimaryTrainingGoal;
  experienceLevel: ExperienceLevel;
  splitType: SplitType;
  weeklyDays: number;
  isLowIntensityMode: boolean;
  weeks: GeneratedWeek[];
}
