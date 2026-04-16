/**
 * Референсные mean/sd для z-score расчётов.
 * Цифры — практические ориентиры для "взрослая аудитория фитнес-приложения",
 * не популяционная статистика. При накоплении собственных данных можно
 * заменить на эмпирические значения.
 */

export const REF_BMI = { mean: 24, sd: 4 } as const;

/** waistToHeightRatio = waist / height. Граница ожирения ≈ 0.5. */
export const REF_WAIST_TO_HEIGHT = { mean: 0.48, sd: 0.06 } as const;

/**
 * heightToMassIndex = height(cm) / weight(kg)^(1/3).
 * Используется в соматотипе Хит–Картера для linearity.
 * Ориентиры: ~42 — среднее, > 44 — линейный, < 40 — плотный.
 */
export const REF_HTM = { mean: 42.5, sd: 1.5 } as const;

/**
 * Относительная сила = max(e1RM squat/bench/deadlift) / weight.
 * Для intermediate-аудитории: 1.0 — средне, 1.5+ — сильный.
 */
export const REF_RELATIVE_STRENGTH = { mean: 1.0, sd: 0.4 } as const;

/**
 * Окружностный индекс = (chest + biceps) / height, нормализованный.
 * Если chest/biceps неизвестны — компонент не учитывается.
 */
export const REF_CIRCUMFERENCE_INDEX = { mean: 0.65, sd: 0.08 } as const;

/**
 * Чистая функция z-score: (value - mean) / sd.
 */
export function zScore(value: number, mean: number, sd: number): number {
  if (sd === 0) return 0;
  return (value - mean) / sd;
}
