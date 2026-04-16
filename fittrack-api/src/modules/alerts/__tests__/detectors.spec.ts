import {
  calculateE1RMDropPct,
  detectOvertraining,
  detectRegression,
  detectStrengthPlateau,
  detectWeightPlateauCut,
  isMonotonicIncreasing,
  maxRelativeVariation,
} from '../detectors';

describe('alert detectors', () => {
  describe('plateau-strength', () => {
    it('null если adherence < 80', () => {
      const result = detectStrengthPlateau({
        mainLifts: [{ exerciseId: 'a', history: [100, 100, 100] }],
        adherencePct: 60,
      });
      expect(result).toBeNull();
    });

    it('срабатывает: e1RM ровный 3 нед при good adherence', () => {
      const result = detectStrengthPlateau({
        mainLifts: [{ exerciseId: 'a', exerciseName: 'Bench', history: [100, 100.5, 100] }],
        adherencePct: 90,
      });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('plateau_strength');
      expect(result?.severity).toBe('warning');
      expect(result?.context?.exerciseId).toBe('a');
    });

    it('null если e1RM растёт', () => {
      const result = detectStrengthPlateau({
        mainLifts: [{ exerciseId: 'a', history: [100, 105, 110] }],
        adherencePct: 90,
      });
      expect(result).toBeNull();
    });

    it('null если истории < 2 значений', () => {
      const result = detectStrengthPlateau({
        mainLifts: [{ exerciseId: 'a', history: [100] }],
        adherencePct: 95,
      });
      expect(result).toBeNull();
    });

    it('берёт первый main_lift в плато', () => {
      const result = detectStrengthPlateau({
        mainLifts: [
          { exerciseId: 'growing', history: [100, 105, 110] },
          { exerciseId: 'plateau', exerciseName: 'OHP', history: [60, 60, 60] },
        ],
        adherencePct: 90,
      });
      expect(result?.context?.exerciseId).toBe('plateau');
    });

    it('maxRelativeVariation: пустой массив → Infinity', () => {
      expect(maxRelativeVariation([])).toBe(Infinity);
      expect(maxRelativeVariation([1])).toBe(Infinity);
    });

    it('maxRelativeVariation: одинаковые значения → 0', () => {
      expect(maxRelativeVariation([100, 100, 100])).toBe(0);
    });
  });

  describe('regression', () => {
    it('срабатывает при e1RM drop > 5% + растущий sRPE', () => {
      const result = detectRegression({
        recentE1RM: [100, 105, 95], // peak 105 → 95 = ~9.5% drop
        sessionRPETrend: [7, 8, 9], // monotonic increase
      });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('regression');
      expect(result?.severity).toBe('critical');
    });

    it('null если drop < 5%', () => {
      const result = detectRegression({
        recentE1RM: [100, 102, 101], // только 1% drop от peak
        sessionRPETrend: [7, 8, 9],
      });
      expect(result).toBeNull();
    });

    it('null если sRPE не растёт монотонно', () => {
      const result = detectRegression({
        recentE1RM: [100, 105, 90],
        sessionRPETrend: [7, 9, 8], // не монотонно
      });
      expect(result).toBeNull();
    });

    it('null если данных < 3 точек', () => {
      const result = detectRegression({
        recentE1RM: [100, 95],
        sessionRPETrend: [7, 8, 9],
      });
      expect(result).toBeNull();
    });

    it('calculateE1RMDropPct: рост → 0', () => {
      expect(calculateE1RMDropPct([100, 105, 110])).toBe(0);
    });

    it('isMonotonicIncreasing', () => {
      expect(isMonotonicIncreasing([1, 2, 3])).toBe(true);
      expect(isMonotonicIncreasing([1, 1, 2])).toBe(false); // равно тоже false
      expect(isMonotonicIncreasing([3, 2, 1])).toBe(false);
      expect(isMonotonicIncreasing([1])).toBe(false);
    });
  });

  describe('weight-plateau-cut', () => {
    const mkPoint = (offsetDays: number, avg14d: number) => ({
      date: new Date(Date.now() - offsetDays * 86400000),
      avg14d,
    });

    it('null если goal не cut', () => {
      const trend = Array.from({ length: 14 }, (_, i) => mkPoint(13 - i, 80));
      expect(
        detectWeightPlateauCut({ bodyweightGoal: 'maintain', weightTrend: trend }),
      ).toBeNull();
      expect(
        detectWeightPlateauCut({ bodyweightGoal: 'bulk', weightTrend: trend }),
      ).toBeNull();
    });

    it('срабатывает: avg14d не меняется на cut', () => {
      const trend = Array.from({ length: 14 }, (_, i) => mkPoint(13 - i, 80.0));
      const result = detectWeightPlateauCut({ bodyweightGoal: 'cut', weightTrend: trend });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('weight_plateau_cut');
      expect(result?.severity).toBe('info');
    });

    it('null если вес явно меняется', () => {
      const trend = Array.from({ length: 14 }, (_, i) => mkPoint(13 - i, 80 - i * 0.1));
      const result = detectWeightPlateauCut({ bodyweightGoal: 'cut', weightTrend: trend });
      expect(result).toBeNull();
    });

    it('null если данных < 14 дней', () => {
      const trend = Array.from({ length: 7 }, (_, i) => mkPoint(6 - i, 80));
      expect(
        detectWeightPlateauCut({ bodyweightGoal: 'cut', weightTrend: trend }),
      ).toBeNull();
    });

    it('null если avg14d=null где-то', () => {
      const trend = Array.from({ length: 14 }, (_, i) => ({
        date: new Date(Date.now() - (13 - i) * 86400000),
        avg14d: (i === 0 ? null : 80) as number | null,
      }));
      expect(
        detectWeightPlateauCut({
          bodyweightGoal: 'cut',
          weightTrend: trend,
        }),
      ).toBeNull();
    });
  });

  describe('overtraining', () => {
    const mkWeek = (avgRPE: number) => ({ weekStart: new Date(), avgSessionRPE: avgRPE });

    it('срабатывает: 3 нед avg RPE > 8 + sleep < 6', () => {
      const result = detectOvertraining({
        weeklySessionRPE: [mkWeek(8.5), mkWeek(9), mkWeek(8.8)],
        sleepHoursAvg: 5.5,
      });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('overtraining');
      expect(result?.severity).toBe('critical');
    });

    it('null если sleep ≥ 6', () => {
      expect(
        detectOvertraining({
          weeklySessionRPE: [mkWeek(9), mkWeek(9), mkWeek(9)],
          sleepHoursAvg: 7,
        }),
      ).toBeNull();
    });

    it('null если только 2 недели', () => {
      expect(
        detectOvertraining({
          weeklySessionRPE: [mkWeek(9), mkWeek(9)],
          sleepHoursAvg: 5,
        }),
      ).toBeNull();
    });

    it('null если хотя бы одна неделя ≤ 8', () => {
      expect(
        detectOvertraining({
          weeklySessionRPE: [mkWeek(9), mkWeek(7), mkWeek(9)],
          sleepHoursAvg: 5,
        }),
      ).toBeNull();
    });
  });
});
