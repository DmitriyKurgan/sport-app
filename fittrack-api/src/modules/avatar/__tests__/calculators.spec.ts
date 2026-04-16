import {
  calculateAvatarDelta,
  calculateAvatarParams,
  deriveChestDepthFromBMI,
  deriveWaistFromBMI,
  mapToRange,
  normalizeToUnit,
} from '../calculators';

describe('avatar calculators', () => {
  describe('mapToRange', () => {
    it('серединный input → середина output', () => {
      expect(mapToRange(100, 50, 150)).toBeCloseTo(1.0, 2);
    });

    it('clamp слева', () => {
      expect(mapToRange(0, 50, 150, 0.7, 1.3)).toBe(0.7);
    });

    it('clamp справа', () => {
      expect(mapToRange(500, 50, 150, 0.7, 1.3)).toBe(1.3);
    });

    it('кастомный output range', () => {
      expect(mapToRange(50, 0, 100, 0, 1)).toBeCloseTo(0.5, 2);
    });
  });

  describe('normalizeToUnit (sigmoid)', () => {
    it('z=0 → 0.5', () => {
      expect(normalizeToUnit(0)).toBe(0.5);
    });

    it('z=+3 → ≈0.95', () => {
      expect(normalizeToUnit(3)).toBeGreaterThan(0.9);
    });

    it('z=-3 → ≈0.05', () => {
      expect(normalizeToUnit(-3)).toBeLessThan(0.1);
    });

    it('монотонная', () => {
      expect(normalizeToUnit(1)).toBeGreaterThan(normalizeToUnit(0));
      expect(normalizeToUnit(2)).toBeGreaterThan(normalizeToUnit(1));
    });
  });

  describe('deriveWaistFromBMI', () => {
    it('высокий BMI + высокая adiposity → широкая талия', () => {
      expect(deriveWaistFromBMI(32, 1.5)).toBeGreaterThan(1.15);
    });

    it('средний BMI без scoring → ~1.0', () => {
      expect(Math.abs(deriveWaistFromBMI(24, 0) - 1)).toBeLessThan(0.1);
    });

    it('низкий BMI → узкая талия', () => {
      expect(deriveWaistFromBMI(18, -1)).toBeLessThan(0.9);
    });
  });

  describe('deriveChestDepthFromBMI', () => {
    it('плотный человек → увеличенная грудь', () => {
      expect(deriveChestDepthFromBMI(30)).toBeGreaterThan(1.1);
    });

    it('худой человек → меньшая грудь', () => {
      expect(deriveChestDepthFromBMI(19)).toBeLessThan(0.9);
    });

    it('null BMI → 1.0', () => {
      expect(deriveChestDepthFromBMI(null)).toBe(1.0);
    });
  });

  describe('calculateAvatarParams', () => {
    const baseMale = {
      sex: 'male' as const,
      heightCm: 175,
      weightKg: 78,
      bmi: 25.5,
    };

    it('средний мужчина 175см → heightScale ≈ 1.0', () => {
      const params = calculateAvatarParams(baseMale);
      expect(params.heightScale).toBe(1.0);
    });

    it('высокий мужчина 190см → heightScale > 1.0', () => {
      const params = calculateAvatarParams({ ...baseMale, heightCm: 190 });
      expect(params.heightScale).toBeGreaterThan(1.0);
    });

    it('женский default для плеч меньше мужского', () => {
      const male = calculateAvatarParams({ ...baseMale });
      const female = calculateAvatarParams({ ...baseMale, sex: 'female' });
      // без chestCm — default зависит от пола
      expect(male.shoulderWidth).toBeGreaterThan(female.shoulderWidth);
    });

    it('замеры перекрывают default', () => {
      const noMeasure = calculateAvatarParams(baseMale);
      const withLargeChest = calculateAvatarParams({ ...baseMale, chestCm: 120 });
      expect(withLargeChest.shoulderWidth).toBeGreaterThan(noMeasure.shoulderWidth);
    });

    it('высокая muscularity + низкая adiposity → высокий muscleDefinition', () => {
      const params = calculateAvatarParams({
        ...baseMale,
        muscularityScore: 2.0,
        adiposityScore: -1.0,
      });
      expect(params.muscleDefinition).toBeGreaterThan(0.9);
    });

    it('высокая adiposity → высокий bodyFatLayer', () => {
      const params = calculateAvatarParams({ ...baseMale, adiposityScore: 2.0 });
      expect(params.bodyFatLayer).toBeGreaterThan(0.8);
    });

    it('все значения обрезаны в допустимых диапазонах', () => {
      const extremeParams = calculateAvatarParams({
        sex: 'male',
        heightCm: 230,
        weightKg: 150,
        bmi: 45,
        chestCm: 200, // неправдоподобно большое
        waistCm: 200,
        adiposityScore: 5,
        muscularityScore: -5,
      });
      expect(extremeParams.shoulderWidth).toBeLessThanOrEqual(1.3);
      expect(extremeParams.waistWidth).toBeLessThanOrEqual(1.3);
      expect(extremeParams.muscleDefinition).toBeLessThanOrEqual(1.0);
      expect(extremeParams.muscleDefinition).toBeGreaterThanOrEqual(0);
      expect(extremeParams.bodyFatLayer).toBeLessThanOrEqual(1.0);
    });
  });

  describe('calculateAvatarDelta', () => {
    const from = {
      heightScale: 1.0,
      shoulderWidth: 1.0,
      chestDepth: 1.0,
      waistWidth: 1.1,
      hipWidth: 1.0,
      armGirth: 1.0,
      thighGirth: 1.0,
      muscleDefinition: 0.3,
      bodyFatLayer: 0.6,
    };

    it('считает дельты по всем параметрам', () => {
      const to = { ...from, waistWidth: 0.95, muscleDefinition: 0.6, bodyFatLayer: 0.3 };
      const delta = calculateAvatarDelta(from, to);
      expect(delta.waistWidth).toBeCloseTo(-0.15, 2);
      expect(delta.muscleDefinition).toBeCloseTo(0.3, 2);
      expect(delta.bodyFatLayer).toBeCloseTo(-0.3, 2);
      expect(delta.heightScale).toBe(0);
    });
  });
});
