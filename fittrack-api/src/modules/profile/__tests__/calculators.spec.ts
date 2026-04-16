import {
  calculateActivityFactor,
  calculateBMI,
  calculateProteinTarget,
  calculateREE,
  calculateTDEE,
} from '../calculators';
import {
  BodyweightGoal,
  DailyActivityLevel,
  Gender,
  NutritionTier,
} from '../enums';

describe('calculators', () => {
  describe('calculateBMI', () => {
    it('нормальный случай: 80кг / 180см → 24.7', () => {
      expect(calculateBMI(80, 180)).toBeCloseTo(24.7, 1);
    });

    it('низкий BMI', () => {
      expect(calculateBMI(55, 175)).toBeCloseTo(18, 0);
    });

    it('округляет до 1 знака', () => {
      const bmi = calculateBMI(70, 170);
      expect(Math.round(bmi * 10) / 10).toBe(bmi);
    });

    it('кидает ошибку при height=0', () => {
      expect(() => calculateBMI(70, 0)).toThrow();
    });
  });

  describe('calculateREE (Mifflin–St Jeor)', () => {
    it('male, 80кг × 180см × 28 лет', () => {
      // REE = 10*80 + 6.25*180 - 5*28 + 5 = 800 + 1125 - 140 + 5 = 1790
      expect(calculateREE({ sex: Gender.MALE, weightKg: 80, heightCm: 180, ageYears: 28 })).toBe(
        1790,
      );
    });

    it('female, 60кг × 165см × 30 лет', () => {
      // REE = 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 → 1320
      expect(calculateREE({ sex: Gender.FEMALE, weightKg: 60, heightCm: 165, ageYears: 30 })).toBe(
        1320,
      );
    });

    it('разница male - female = 166 при одинаковых параметрах', () => {
      const male = calculateREE({ sex: Gender.MALE, weightKg: 70, heightCm: 175, ageYears: 30 });
      const female = calculateREE({
        sex: Gender.FEMALE,
        weightKg: 70,
        heightCm: 175,
        ageYears: 30,
      });
      expect(male - female).toBe(166);
    });
  });

  describe('calculateActivityFactor', () => {
    it('sedentary + 3 дня → 1.375', () => {
      expect(
        calculateActivityFactor({
          dailyActivityLevel: DailyActivityLevel.SEDENTARY,
          weeklyTrainingDaysTarget: 3,
        }),
      ).toBe(1.375);
    });

    it('sedentary + 4 дня → 1.55', () => {
      expect(
        calculateActivityFactor({
          dailyActivityLevel: DailyActivityLevel.SEDENTARY,
          weeklyTrainingDaysTarget: 4,
        }),
      ).toBe(1.55);
    });

    it('moderate + 3 дня → 1.55', () => {
      expect(
        calculateActivityFactor({
          dailyActivityLevel: DailyActivityLevel.MODERATE,
          weeklyTrainingDaysTarget: 3,
        }),
      ).toBe(1.55);
    });

    it('active + 5 дней → 1.9', () => {
      expect(
        calculateActivityFactor({
          dailyActivityLevel: DailyActivityLevel.ACTIVE,
          weeklyTrainingDaysTarget: 5,
        }),
      ).toBe(1.9);
    });
  });

  describe('calculateTDEE', () => {
    it('REE=1800 × 1.55 → 2790', () => {
      expect(calculateTDEE(1800, 1.55)).toBe(2790);
    });

    it('округляет до целого', () => {
      expect(calculateTDEE(1790, 1.55)).toBe(2775);
    });
  });

  describe('calculateProteinTarget', () => {
    it('default: 80кг × 1.6 = 128', () => {
      expect(
        calculateProteinTarget({
          weightKg: 80,
          bodyweightGoal: BodyweightGoal.MAINTAIN,
          tier: NutritionTier.STANDARD,
        }),
      ).toBe(128);
    });

    it('bulk default = 1.6 г/кг', () => {
      expect(
        calculateProteinTarget({
          weightKg: 75,
          bodyweightGoal: BodyweightGoal.BULK,
          tier: NutritionTier.STANDARD,
        }),
      ).toBe(120);
    });

    it('cut + advanced = 2.3 г/кг (80кг → 184)', () => {
      expect(
        calculateProteinTarget({
          weightKg: 80,
          bodyweightGoal: BodyweightGoal.CUT,
          tier: NutritionTier.ADVANCED,
        }),
      ).toBe(184);
    });

    it('cut + budget НЕ повышает белок (только advanced)', () => {
      expect(
        calculateProteinTarget({
          weightKg: 80,
          bodyweightGoal: BodyweightGoal.CUT,
          tier: NutritionTier.BUDGET,
        }),
      ).toBe(128);
    });
  });
});
