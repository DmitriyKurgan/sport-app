import { ProgramPhase } from '../enums';

/**
 * 12-недельная структура: 3 мезоцикла × (3 недели нагрузки + 1 делoad).
 * Источник: sport-research.md → trainingEngine.programStructure.phases.
 */

export interface PhaseConfig {
  phase: ProgramPhase;
  mesocycleNumber: 1 | 2 | 3;
  intensityModifier: number; // коэффициент от базовой интенсивности
  volumeModifier: number;    // коэффициент от базового объёма
  description: string;
}

export const PHASES: Record<number, PhaseConfig> = {
  1: { phase: ProgramPhase.ADAPTATION,    mesocycleNumber: 1, intensityModifier: 0.75, volumeModifier: 0.85, description: 'Адаптация: техника' },
  2: { phase: ProgramPhase.ADAPTATION,    mesocycleNumber: 1, intensityModifier: 0.80, volumeModifier: 0.95, description: 'Адаптация: рост объёма' },
  3: { phase: ProgramPhase.ADAPTATION,    mesocycleNumber: 1, intensityModifier: 0.85, volumeModifier: 1.00, description: 'Адаптация: пик' },
  4: { phase: ProgramPhase.DELOAD,        mesocycleNumber: 1, intensityModifier: 0.65, volumeModifier: 0.55, description: 'Разгрузка' },
  5: { phase: ProgramPhase.ACCUMULATION,  mesocycleNumber: 2, intensityModifier: 0.80, volumeModifier: 1.05, description: 'Накопление: объём' },
  6: { phase: ProgramPhase.ACCUMULATION,  mesocycleNumber: 2, intensityModifier: 0.82, volumeModifier: 1.10, description: 'Накопление' },
  7: { phase: ProgramPhase.ACCUMULATION,  mesocycleNumber: 2, intensityModifier: 0.85, volumeModifier: 1.15, description: 'Накопление: пик' },
  8: { phase: ProgramPhase.DELOAD,        mesocycleNumber: 2, intensityModifier: 0.65, volumeModifier: 0.55, description: 'Разгрузка' },
  9: { phase: ProgramPhase.INTENSIFICATION, mesocycleNumber: 3, intensityModifier: 0.90, volumeModifier: 0.90, description: 'Интенсификация' },
  10:{ phase: ProgramPhase.INTENSIFICATION, mesocycleNumber: 3, intensityModifier: 0.93, volumeModifier: 0.85, description: 'Интенсификация' },
  11:{ phase: ProgramPhase.INTENSIFICATION, mesocycleNumber: 3, intensityModifier: 0.95, volumeModifier: 0.80, description: 'Интенсификация: пик' },
  12:{ phase: ProgramPhase.DELOAD,        mesocycleNumber: 3, intensityModifier: 0.60, volumeModifier: 0.50, description: 'Разгрузка + пересборка' },
};

export const TOTAL_WEEKS = 12;

export const DELOAD_WEEKS: readonly number[] = [4, 8, 12];

export function getPhase(weekNumber: number): PhaseConfig {
  const phase = PHASES[weekNumber];
  if (!phase) throw new Error(`Invalid weekNumber: ${weekNumber}. Must be 1-12.`);
  return phase;
}
