import {
  calculateAdiposityScore,
  calculateLinearityScore,
  calculateMuscularityScore,
  classify,
  REF_BMI,
  zScore,
} from '../calculators';
import { BodyScores } from '../interfaces';

describe('body-type calculators', () => {
  describe('zScore', () => {
    it('(value - mean) / sd', () => {
      expect(zScore(28, 24, 4)).toBe(1);
      expect(zScore(20, 24, 4)).toBe(-1);
      expect(zScore(24, 24, 4)).toBe(0);
    });
    it('sd=0 → 0', () => {
      expect(zScore(10, 5, 0)).toBe(0);
    });
  });

  describe('calculateAdiposityScore', () => {
    it('средний BMI → ~0', () => {
      expect(calculateAdiposityScore({ weightKg: 78, heightCm: 180 })).toBeLessThan(0.1);
    });

    it('высокий BMI → положительный score', () => {
      // 100кг × 170см → BMI ≈ 34.6 → z ≈ +2.6 (очень высокая адипозность)
      expect(calculateAdiposityScore({ weightKg: 100, heightCm: 170 })).toBeGreaterThan(1);
    });

    it('низкий BMI → отрицательный score', () => {
      // 55кг × 180см → BMI ≈ 17 → z ≈ -1.75
      expect(calculateAdiposityScore({ weightKg: 55, heightCm: 180 })).toBeLessThan(-1);
    });

    it('waistCm усредняется с BMI', () => {
      // При BMI ≈ 25 (нейтрально), но большом waist → score повышается
      const noWaist = calculateAdiposityScore({ weightKg: 80, heightCm: 180 });
      const largeWaist = calculateAdiposityScore({ weightKg: 80, heightCm: 180, waistCm: 110 });
      expect(largeWaist).toBeGreaterThan(noWaist);
    });
  });

  describe('calculateMuscularityScore', () => {
    it('нет e1RM и нет окружностей → 0 (нейтрально)', () => {
      expect(calculateMuscularityScore({ weightKg: 80, heightCm: 180 })).toBe(0);
    });

    it('сильный лифт → положительный score', () => {
      // 80кг спортсмен, жим 120кг → RSI = 1.5 → z ≈ +1.25
      expect(
        calculateMuscularityScore({ weightKg: 80, heightCm: 180, e1rmBenchKg: 120 }),
      ).toBeGreaterThan(1);
    });

    it('берёт максимум из squat/bench/deadlift', () => {
      const score = calculateMuscularityScore({
        weightKg: 80,
        heightCm: 180,
        e1rmSquatKg: 60,
        e1rmBenchKg: 50,
        e1rmDeadliftKg: 160, // ← максимум, RSI = 2.0
      });
      expect(score).toBeGreaterThan(2); // z ≈ +2.5
    });

    it('слабый лифт → отрицательный score', () => {
      // 80кг, жим 40кг → RSI = 0.5 → z ≈ -1.25
      const score = calculateMuscularityScore({
        weightKg: 80,
        heightCm: 180,
        e1rmBenchKg: 40,
      });
      expect(score).toBeLessThan(-1);
    });
  });

  describe('calculateLinearityScore', () => {
    it('высокий рост + низкий вес → высокая линейность', () => {
      // 65кг × 190см → htm ≈ 190/65^(1/3) ≈ 47.1 → z ≈ +3.07
      expect(calculateLinearityScore({ weightKg: 65, heightCm: 190 })).toBeGreaterThan(2);
    });

    it('низкий рост + высокий вес → низкая линейность', () => {
      // 100кг × 165см → htm ≈ 165/100^(1/3) ≈ 35.5 → z ≈ -4.7
      expect(calculateLinearityScore({ weightKg: 100, heightCm: 165 })).toBeLessThan(-3);
    });

    it('средний → около 0', () => {
      // 80кг × 180см → htm ≈ 41.8 → z ≈ -0.47
      expect(Math.abs(calculateLinearityScore({ weightKg: 80, heightCm: 180 }))).toBeLessThan(1);
    });
  });

  describe('classify', () => {
    it('endomorph: высокая adiposity', () => {
      const scores: BodyScores = { adiposity: 1.2, muscularity: 0.2, linearity: -0.5 };
      const result = classify(scores);
      expect(result.type).toBe('endomorph');
    });

    it('ectomorph: высокая linearity + низкая adiposity', () => {
      const scores: BodyScores = { adiposity: -1.0, muscularity: 0.0, linearity: 1.5 };
      const result = classify(scores);
      expect(result.type).toBe('ectomorph');
    });

    it('mesomorph: высокая muscularity без высокой adiposity', () => {
      const scores: BodyScores = { adiposity: 0.0, muscularity: 1.5, linearity: 0.0 };
      const result = classify(scores);
      expect(result.type).toBe('mesomorph');
    });

    it('hybrid: все низкие — возвращает top-2', () => {
      const scores: BodyScores = { adiposity: 0.2, muscularity: 0.3, linearity: 0.1 };
      const result = classify(scores);
      expect(result.type).toBe('hybrid');
      expect(result.confidence).toBe('low');
      expect(result.dominantComponents).toHaveLength(2);
      expect(result.dominantComponents).toContain('muscularity');
      expect(result.dominantComponents).toContain('adiposity');
    });

    it('hybrid: adiposity высокая + muscularity высокая → endomorph (adiposity приоритет)', () => {
      // Пограничный случай: оба высокие, но adiposity ≥ muscularity
      const scores: BodyScores = { adiposity: 1.0, muscularity: 0.9, linearity: -0.2 };
      const result = classify(scores);
      expect(result.type).toBe('endomorph');
    });

    it('confidence high при сильном отрыве', () => {
      const scores: BodyScores = { adiposity: 2.0, muscularity: 0.3, linearity: 0.1 };
      const result = classify(scores);
      expect(result.type).toBe('endomorph');
      expect(result.confidence).toBe('high');
    });

    it('confidence medium при среднем отрыве', () => {
      // gap ≈ 0.4 → medium (gap ≥ 0.3, но < 0.6)
      const scores: BodyScores = { adiposity: 1.0, muscularity: 0.6, linearity: -0.2 };
      const result = classify(scores);
      expect(result.confidence).toBe('medium');
    });
  });
});
