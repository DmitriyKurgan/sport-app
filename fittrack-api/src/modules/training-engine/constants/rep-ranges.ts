import { PrimaryTrainingGoal } from '../../profile/enums';

/**
 * Параметры подходов по цели тренировок.
 * Источник: sport-research.md → setRepPrescription + rep-ranges.
 *
 *   targetRIR: [min, max] — engine выбирает в зависимости от фазы
 *               (на deload +1, на intensification -1)
 */
export interface RepRangeConfig {
  setsMin: number;
  setsMax: number;
  repsMin: number;
  repsMax: number;
  targetRIRMin: number;
  targetRIRMax: number;
  restSeconds: number;
}

export const REP_RANGES: Record<PrimaryTrainingGoal, RepRangeConfig> = {
  [PrimaryTrainingGoal.STRENGTH]: {
    setsMin: 3, setsMax: 5, repsMin: 3, repsMax: 6,
    targetRIRMin: 1, targetRIRMax: 2, restSeconds: 180,
  },
  [PrimaryTrainingGoal.HYPERTROPHY]: {
    setsMin: 3, setsMax: 4, repsMin: 8, repsMax: 12,
    targetRIRMin: 2, targetRIRMax: 3, restSeconds: 90,
  },
  [PrimaryTrainingGoal.FITNESS]: {
    setsMin: 2, setsMax: 3, repsMin: 10, repsMax: 15,
    targetRIRMin: 3, targetRIRMax: 3, restSeconds: 60,
  },
  [PrimaryTrainingGoal.ENDURANCE_MIXED]: {
    setsMin: 2, setsMax: 3, repsMin: 15, repsMax: 20,
    targetRIRMin: 3, targetRIRMax: 3, restSeconds: 45,
  },
  [PrimaryTrainingGoal.SPORT_PREP]: {
    setsMin: 3, setsMax: 4, repsMin: 5, repsMax: 8,
    targetRIRMin: 2, targetRIRMax: 2, restSeconds: 120,
  },
};

export function getRepRange(goal: PrimaryTrainingGoal): RepRangeConfig {
  return REP_RANGES[goal];
}
