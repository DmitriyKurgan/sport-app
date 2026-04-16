/**
 * BMI = weight(kg) / (height(m))^2
 * Источник: стандартная формула, ВОЗ.
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) throw new Error('heightCm должен быть > 0');
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10; // 1 знак после запятой
}
