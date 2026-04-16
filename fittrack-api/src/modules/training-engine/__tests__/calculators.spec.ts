import {
  calculateE1RM,
  calculateInternalLoad,
  calculateProgression,
  calculateVolumeLoad,
  detectE1RMDrop,
  ProgressionContext,
  shouldDeload,
} from '../calculators';
import { PROGRESSION } from '../constants';
import { PlannedExercise, SetLog } from '../interfaces';

describe('training-engine calculators', () => {
  describe('calculateE1RM (Epley)', () => {
    it('1 повтор → вес без изменений', () => {
      expect(calculateE1RM(100, 1)).toBe(100);
    });

    it('10 повторов × 80кг → ~107', () => {
      // 80 × (1 + 10/30) = 106.67
      expect(calculateE1RM(80, 10)).toBeCloseTo(106.67, 1);
    });

    it('0 reps → 0', () => {
      expect(calculateE1RM(100, 0)).toBe(0);
    });

    it('монотонность: больше повторов при том же весе → больше e1RM', () => {
      expect(calculateE1RM(100, 5)).toBeGreaterThan(calculateE1RM(100, 3));
    });
  });

  describe('calculateVolumeLoad', () => {
    it('суммирует weight × reps', () => {
      const logs: SetLog[] = [
        { weightKg: 100, reps: 10 },
        { weightKg: 100, reps: 8 },
        { weightKg: 90, reps: 10 },
      ];
      expect(calculateVolumeLoad(logs)).toBe(1000 + 800 + 900);
    });

    it('исключает warmup', () => {
      const logs: SetLog[] = [
        { weightKg: 50, reps: 10, isWarmup: true },
        { weightKg: 100, reps: 10 },
      ];
      expect(calculateVolumeLoad(logs)).toBe(1000);
    });

    it('пустой массив → 0', () => {
      expect(calculateVolumeLoad([])).toBe(0);
    });
  });

  describe('calculateInternalLoad', () => {
    it('session-RPE × duration', () => {
      expect(calculateInternalLoad(7, 60)).toBe(420);
    });

    it('невалидный вход → 0', () => {
      expect(calculateInternalLoad(-1, 60)).toBe(0);
      expect(calculateInternalLoad(7, 0)).toBe(0);
    });
  });

  describe('shouldDeload', () => {
    const empty = {
      weekNumber: 5,
      avgRIRPerWeek: [],
      avgSessionRPEPerWeek: [],
      e1rmHistory: [],
    };

    it('плановый делoad на 4-й неделе', () => {
      const d = shouldDeload({ ...empty, weekNumber: 4 });
      expect(d.shouldDeload).toBe(true);
      expect(d.reason).toBe('scheduled');
    });

    it('плановый делoad на 8 и 12', () => {
      expect(shouldDeload({ ...empty, weekNumber: 8 }).reason).toBe('scheduled');
      expect(shouldDeload({ ...empty, weekNumber: 12 }).reason).toBe('scheduled');
    });

    it('не делoad на 5', () => {
      const d = shouldDeload({ ...empty, weekNumber: 5 });
      expect(d.shouldDeload).toBe(false);
    });

    it('rir_exhaustion: 3 недели avgRIR < 1', () => {
      const d = shouldDeload({
        ...empty,
        weekNumber: 5,
        avgRIRPerWeek: [0.5, 0.3, 0.8],
      });
      expect(d.shouldDeload).toBe(true);
      expect(d.reason).toBe('rir_exhaustion');
    });

    it('не срабатывает если только 2 недели', () => {
      const d = shouldDeload({
        ...empty,
        weekNumber: 5,
        avgRIRPerWeek: [0.5, 0.3],
      });
      expect(d.shouldDeload).toBe(false);
    });

    it('session_rpe_overload: 3 недели > 9', () => {
      const d = shouldDeload({
        ...empty,
        weekNumber: 5,
        avgSessionRPEPerWeek: [9.2, 9.3, 9.1],
      });
      expect(d.shouldDeload).toBe(true);
      expect(d.reason).toBe('session_rpe_overload');
    });

    it('e1rm_regression: падение > 5%', () => {
      const d = shouldDeload({
        ...empty,
        weekNumber: 5,
        e1rmHistory: [100, 105, 95], // пик 105, текущее 95 → drop ≈ 9.5%
      });
      expect(d.shouldDeload).toBe(true);
      expect(d.reason).toBe('e1rm_regression');
    });
  });

  describe('detectE1RMDrop', () => {
    it('стабильный рост → false', () => {
      expect(detectE1RMDrop([100, 102, 105], 5)).toBe(false);
    });

    it('падение 3% → false (ниже порога 5%)', () => {
      expect(detectE1RMDrop([100, 105, 102], 5)).toBe(false);
    });

    it('падение 10% → true', () => {
      expect(detectE1RMDrop([100, 110, 99], 5)).toBe(true);
    });

    it('меньше 3 точек → false', () => {
      expect(detectE1RMDrop([100, 95], 5)).toBe(false);
    });
  });

  describe('calculateProgression', () => {
    const plan: PlannedExercise = {
      exerciseId: 'ex-1',
      sets: 3,
      repsMin: 8,
      repsMax: 12,
      targetRIR: 2,
      targetLoadKg: 80,
      isCompound: true,
    };

    it('INCREASE_LOAD: все подходы на repsMax при RIR ≤ 2 + previousHit', () => {
      const ctx: ProgressionContext = {
        currentWeekLogs: [
          { weightKg: 80, reps: 12, rir: 2 },
          { weightKg: 80, reps: 12, rir: 2 },
          { weightKg: 80, reps: 12, rir: 1 },
        ],
        plan,
        previousWeekHit: true,
      };
      const result = calculateProgression(ctx);
      expect(result.action).toBe('INCREASE_LOAD');
      expect(result.newWeightKg).toBe(82.5); // 80 + 2.5 compound
    });

    it('compound: +2.5кг', () => {
      const result = calculateProgression({
        plan: { ...plan, isCompound: true },
        currentWeekLogs: [{ weightKg: 80, reps: 12, rir: 1 }],
        previousWeekHit: true,
      });
      expect(result.newWeightKg).toBe(82.5);
    });

    it('isolation: +1.25кг', () => {
      const result = calculateProgression({
        plan: { ...plan, isCompound: false, targetLoadKg: 20 },
        currentWeekLogs: [{ weightKg: 20, reps: 12, rir: 2 }],
        previousWeekHit: true,
      });
      expect(result.newWeightKg).toBe(21.25);
    });

    it('cap по +10% в неделю', () => {
      const result = calculateProgression({
        plan: { ...plan, targetLoadKg: 20 }, // 20 + 2.5 = 22.5 но cap 22
        currentWeekLogs: [{ weightKg: 20, reps: 12, rir: 2 }],
        previousWeekHit: true,
      });
      expect(result.newWeightKg).toBe(22); // cap 20 * 1.10
    });

    it('HOLD: первый раз hit → нет previousHit', () => {
      const result = calculateProgression({
        plan,
        currentWeekLogs: [{ weightKg: 80, reps: 12, rir: 2 }],
        previousWeekHit: false,
      });
      expect(result.action).toBe('HOLD');
      expect(result.newWeightKg).toBe(80);
    });

    it('REGRESS: большинство подходов провалены', () => {
      const result = calculateProgression({
        plan,
        currentWeekLogs: [
          { weightKg: 80, reps: 5, rir: 0 },
          { weightKg: 80, reps: 6, rir: 0 },
          { weightKg: 80, reps: 7, rir: 0 },
        ],
        previousWeekHit: false,
      });
      expect(result.action).toBe('REGRESS');
      expect(result.newWeightKg).toBe(76); // 80 * 0.95
    });

    it('HOLD при смешанной картине', () => {
      const result = calculateProgression({
        plan,
        currentWeekLogs: [
          { weightKg: 80, reps: 8, rir: 2 },
          { weightKg: 80, reps: 10, rir: 1 },
          { weightKg: 80, reps: 7, rir: 0 }, // один провал
        ],
        previousWeekHit: false,
      });
      expect(result.action).toBe('HOLD');
    });

    it('без логов → HOLD', () => {
      const result = calculateProgression({
        plan,
        currentWeekLogs: [],
        previousWeekHit: true,
      });
      expect(result.action).toBe('HOLD');
    });
  });

  it('константы на месте', () => {
    expect(PROGRESSION.compoundIncrementKg).toBe(2.5);
    expect(PROGRESSION.maxWeeklyIncreasePct).toBe(10);
  });
});
