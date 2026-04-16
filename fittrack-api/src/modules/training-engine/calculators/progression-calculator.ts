import { PROGRESSION } from '../constants';
import {
  PlannedExercise,
  ProgressionResult,
  SetLog,
} from '../interfaces';

/**
 * Double Progression + RIR autoregulation.
 *
 * Алгоритм (sport-research.md → progressionAlgorithm.doubleProgression):
 *   1. Если все рабочие подходы >= repsMax при RIR <= target И это уже 2-я неделя подряд
 *      → INCREASE_LOAD (compound +2.5кг, isolation +1.25кг, макс +10%/нед)
 *   2. Если все подходы в диапазоне reps [repsMin..repsMax]
 *      → HOLD (добавить 1 повтор на след. неделе)
 *   3. Если большинство подходов < repsMin
 *      → REGRESS (-5% от веса)
 *
 * currentHitFlag и previousHitFlag — флаги "hit" для текущей и предыдущей недели.
 * 2 раза подряд подтверждает что пользователь готов к прибавке.
 */

export interface ProgressionContext {
  currentWeekLogs: SetLog[];
  plan: PlannedExercise;
  /** true, если на ПРЕДЫДУЩЕЙ неделе было выполнено "hit repsMax при RIR <= target". */
  previousWeekHit: boolean;
}

export function calculateProgression(ctx: ProgressionContext): ProgressionResult {
  const { currentWeekLogs, plan, previousWeekHit } = ctx;
  const workingSets = currentWeekLogs.filter((l) => !l.isWarmup);

  if (workingSets.length === 0) {
    return { action: 'HOLD', newWeightKg: plan.targetLoadKg, reason: 'no_sets_logged' };
  }

  // === Оценка выполнения ===

  const allHitRepsMax = workingSets.every((s) => {
    const rirOk = s.rir === null || s.rir === undefined || s.rir <= plan.targetRIR;
    return s.reps >= plan.repsMax && rirOk;
  });

  const allInRange = workingSets.every((s) => s.reps >= plan.repsMin);

  const failedRange =
    workingSets.filter((s) => s.reps < plan.repsMin).length > workingSets.length / 2;

  // === Решение ===

  if (allHitRepsMax && previousWeekHit) {
    const increment = plan.isCompound
      ? PROGRESSION.compoundIncrementKg
      : PROGRESSION.isolationIncrementKg;

    const currentLoad = plan.targetLoadKg ?? 0;
    const capped = currentLoad * (1 + PROGRESSION.maxWeeklyIncreasePct / 100);
    const newWeight = Math.min(currentLoad + increment, capped);

    return {
      action: 'INCREASE_LOAD',
      newWeightKg: round2(newWeight),
      newRepsMin: plan.repsMin,
      newRepsMax: plan.repsMax,
      reason: 'hit_reps_max_two_weeks_in_row',
    };
  }

  if (failedRange) {
    const currentLoad = plan.targetLoadKg ?? 0;
    const reduced = currentLoad * (1 - PROGRESSION.failureReductionPct / 100);
    return {
      action: 'REGRESS',
      newWeightKg: round2(reduced),
      reason: 'majority_sets_below_reps_min',
    };
  }

  if (allInRange) {
    return {
      action: 'HOLD',
      newWeightKg: plan.targetLoadKg,
      targetRepsIncrement: 1,
      reason: allHitRepsMax ? 'hit_first_time_confirm_next_week' : 'in_range_add_reps',
    };
  }

  // Смешанная картина: часть подходов провалена, но не большинство.
  return {
    action: 'HOLD',
    newWeightKg: plan.targetLoadKg,
    reason: 'mixed_result_hold',
  };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
