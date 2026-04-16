/**
 * Линейно отображает value из диапазона [inMin, inMax] в [outMin, outMax].
 * Значения за пределами обрезаются (clamp).
 */
export function mapToRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin = 0.7,
  outMax = 1.3,
): number {
  if (inMax === inMin) return (outMin + outMax) / 2;
  const clamped = Math.max(inMin, Math.min(inMax, value));
  const t = (clamped - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

/**
 * Приводит z-score (примерно -3..+3) к интервалу 0..1 через сигмоиду.
 * Используется для muscleDefinition / bodyFatLayer.
 */
export function normalizeToUnit(zScore: number): number {
  // Логистическая функция: при z=0 → 0.5, при z=+3 → ~0.95, при z=-3 → ~0.05
  return 1 / (1 + Math.exp(-zScore));
}

/**
 * Приблизительная оценка waistWidth из BMI и adiposity-score,
 * когда нет реального замера талии.
 *
 *   низкий BMI (< 20) + низкая adiposity → узкая талия (~0.85)
 *   средний BMI (~24) → нейтрально (1.0)
 *   высокий BMI (> 30) → широкая талия (~1.2)
 */
export function deriveWaistFromBMI(bmi: number | null, adiposityScore: number): number {
  const base = bmi ? mapToRange(bmi, 17, 34) : 1.0;
  // adiposity корректирует в пределах ±0.1
  const adjustment = Math.max(-0.1, Math.min(0.1, adiposityScore * 0.05));
  return round3(base + adjustment);
}

/**
 * Оценка chestDepth из BMI — при одинаковом росте плотные люди имеют больший обхват груди.
 */
export function deriveChestDepthFromBMI(bmi: number | null): number {
  return round3(bmi ? mapToRange(bmi, 18, 32) : 1.0);
}

export function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}

export function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
