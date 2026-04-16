import { BodyweightGoal, NutritionTier } from '../../profile/enums';
import { ProgramPhase } from '../../training-engine/enums';
import { calculateCalorieTarget, calculateMacros } from '../calculators';

describe('nutrition calculators', () => {
  describe('calculateCalorieTarget', () => {
    it('maintain → tdee без изменений', () => {
      expect(
        calculateCalorieTarget({ tdee: 2500, bodyweightGoal: BodyweightGoal.MAINTAIN }),
      ).toBe(2500);
    });

    it('cut → tdee − 300 (default)', () => {
      expect(
        calculateCalorieTarget({ tdee: 2500, bodyweightGoal: BodyweightGoal.CUT }),
      ).toBe(2200);
    });

    it('cut: cap −600 ккал (даже если default дал бы ниже)', () => {
      // При tdee=1000, default −300 = 700, но cap −600 = 400 → max(700, 400) = 700
      expect(
        calculateCalorieTarget({ tdee: 1000, bodyweightGoal: BodyweightGoal.CUT }),
      ).toBe(700);
    });

    it('bulk → tdee + 150 (малый профицит)', () => {
      expect(
        calculateCalorieTarget({ tdee: 2500, bodyweightGoal: BodyweightGoal.BULK }),
      ).toBe(2650);
    });

    it('accumulation phase: +5%', () => {
      const base = calculateCalorieTarget({
        tdee: 2500,
        bodyweightGoal: BodyweightGoal.MAINTAIN,
      });
      const accum = calculateCalorieTarget({
        tdee: 2500,
        bodyweightGoal: BodyweightGoal.MAINTAIN,
        phase: ProgramPhase.ACCUMULATION,
      });
      expect(accum).toBe(Math.round(base * 1.05));
    });

    it('deload phase + cut: −5%', () => {
      const base = calculateCalorieTarget({
        tdee: 2500,
        bodyweightGoal: BodyweightGoal.CUT,
      });
      const deload = calculateCalorieTarget({
        tdee: 2500,
        bodyweightGoal: BodyweightGoal.CUT,
        phase: ProgramPhase.DELOAD,
      });
      expect(deload).toBe(Math.round(base * 0.95));
    });

    it('deload + bulk: НЕ снижает калории (для bulk фаза deload не уменьшает)', () => {
      const base = calculateCalorieTarget({
        tdee: 2500,
        bodyweightGoal: BodyweightGoal.BULK,
      });
      const deload = calculateCalorieTarget({
        tdee: 2500,
        bodyweightGoal: BodyweightGoal.BULK,
        phase: ProgramPhase.DELOAD,
      });
      expect(deload).toBe(base);
    });
  });

  describe('calculateMacros', () => {
    it('default 1.6 г/кг белка для maintain × standard', () => {
      const m = calculateMacros({
        weightKg: 80,
        calories: 2500,
        bodyweightGoal: BodyweightGoal.MAINTAIN,
        tier: NutritionTier.STANDARD,
      });
      expect(m.proteinG).toBe(128); // 80 × 1.6
    });

    it('cut + advanced → 2.3 г/кг при достаточных калориях', () => {
      // При 2500 ккал у 80кг карбы > 3 г/кг → safeguard не срабатывает
      const m = calculateMacros({
        weightKg: 80,
        calories: 2500,
        bodyweightGoal: BodyweightGoal.CUT,
        tier: NutritionTier.ADVANCED,
      });
      expect(m.proteinG).toBe(184); // 80 × 2.3
    });

    it('cut + advanced при низких калориях → safeguard снижает белок', () => {
      // При 2200 ккал protein 2.3 г/кг даёт карбы < 3 г/кг → safeguard
      const m = calculateMacros({
        weightKg: 80,
        calories: 2200,
        bodyweightGoal: BodyweightGoal.CUT,
        tier: NutritionTier.ADVANCED,
      });
      expect(m.proteinG).toBeLessThan(184);
      expect(m.carbsGPerKg).toBeGreaterThanOrEqual(3);
    });

    it('cut + budget НЕ повышает белок', () => {
      const m = calculateMacros({
        weightKg: 80,
        calories: 2200,
        bodyweightGoal: BodyweightGoal.CUT,
        tier: NutritionTier.BUDGET,
      });
      expect(m.proteinG).toBe(128);
    });

    it('жиры ≈ 25% энергии', () => {
      const m = calculateMacros({
        weightKg: 80,
        calories: 2400,
        bodyweightGoal: BodyweightGoal.MAINTAIN,
        tier: NutritionTier.STANDARD,
      });
      const fatKcal = m.fatG * 9;
      const ratio = fatKcal / 2400;
      expect(ratio).toBeGreaterThanOrEqual(0.20);
      expect(ratio).toBeLessThanOrEqual(0.30);
    });

    it('сумма БЖУ примерно равна целевым калориям', () => {
      const m = calculateMacros({
        weightKg: 80,
        calories: 2500,
        bodyweightGoal: BodyweightGoal.MAINTAIN,
        tier: NutritionTier.STANDARD,
      });
      const total = m.proteinG * 4 + m.fatG * 9 + m.carbsG * 4;
      expect(Math.abs(total - 2500)).toBeLessThan(20); // в пределах округлений
    });

    it('proteinPerMeal = 0.25 г/кг', () => {
      const m = calculateMacros({
        weightKg: 80,
        calories: 2500,
        bodyweightGoal: BodyweightGoal.MAINTAIN,
        tier: NutritionTier.STANDARD,
      });
      expect(m.proteinPerMealG).toBe(20);
    });

    it('safeguard: при низких калориях карбы не уходят в минус', () => {
      const m = calculateMacros({
        weightKg: 80,
        calories: 1000, // экстремально низко
        bodyweightGoal: BodyweightGoal.CUT,
        tier: NutritionTier.STANDARD,
      });
      expect(m.carbsG).toBeGreaterThanOrEqual(0);
    });
  });
});
