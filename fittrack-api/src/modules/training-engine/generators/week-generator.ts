import { PhaseConfig } from '../constants';
import { SplitRule } from '../constants/splits';
import { MovementPattern } from '../enums';
import {
  ExerciseCatalogItem,
  GeneratedWeek,
  ProfileConfig,
} from '../interfaces';
import { generateDay } from './day-generator';

export interface WeekGenerationContext {
  weekNumber: number;
  phase: PhaseConfig;
  splitRule: SplitRule;
  profile: ProfileConfig;
  catalog: ExerciseCatalogItem[];
  /** Фиксированные main-lifts на мезоцикл. */
  mainLifts: Map<MovementPattern, ExerciseCatalogItem>;
  bodyweightOnly?: boolean;
}

/**
 * Генерация одной недели — для каждого дня splitRule вызывается generateDay.
 */
export function generateWeek(ctx: WeekGenerationContext): GeneratedWeek {
  const { weekNumber, phase, splitRule, profile, catalog, mainLifts, bodyweightOnly } = ctx;

  const days = splitRule.days.map((splitDay, idx) =>
    generateDay({
      dayNumber: idx + 1,
      splitDay,
      profile,
      catalog,
      phase,
      weekNumber,
      mainLifts,
      accessoryRotationSeed: weekNumber,
      bodyweightOnly,
    }),
  );

  return {
    weekNumber,
    phase: phase.phase,
    mesocycleNumber: phase.mesocycleNumber,
    intensityModifier: phase.intensityModifier,
    volumeModifier: phase.volumeModifier,
    isDeload: phase.phase === 'deload',
    description: phase.description,
    days,
  };
}
