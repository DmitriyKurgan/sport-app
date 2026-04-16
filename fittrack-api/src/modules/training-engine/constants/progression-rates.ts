/**
 * Константы прогрессии и делoad.
 * Источник: sport-research.md → progressionAlgorithm + deloadRule.
 *
 * ВАЖНО: это SAFEGUARDS — их не должно перекрывать никакое правило.
 */
export const PROGRESSION = {
  /** Прибавка для compound (squat/bench/deadlift/row). */
  compoundIncrementKg: 2.5,
  /** Прибавка для isolation (curl, raise и т.п.). */
  isolationIncrementKg: 1.25,
  /** Hard cap: не больше 10% в неделю, даже если формула дала больше. */
  maxWeeklyIncreasePct: 10,
  /** При провале диапазона: снижение веса в %. */
  failureReductionPct: 5,
  /** Redload: -30..50% объёма. */
  deloadVolumeReductionPct: 40,
  /** Redload: -5..10% интенсивности. */
  deloadIntensityReductionPct: 7,
  /** Порог session-RPE для принудительного делoada. */
  forcedDeloadRPEThreshold: 9.0,
  /** Сколько недель подряд должно быть превышение для forced deload. */
  forcedDeloadStreak: 3,
  /** Падение e1RM (%) на 2 подряд тренировках — триггер делoаd. */
  e1RMDropThresholdPct: 5,
  /** Если требуется 2 раза подряд hit для повышения. */
  hitStreakForIncrease: 2,
} as const;
