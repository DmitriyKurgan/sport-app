/**
 * Estimated 1-Rep-Max (Epley formula).
 *   1RM = weight × (1 + reps / 30)
 *
 * Используется для трекинга силы без тестирования max.
 * Источник: sport-research.md → analytics (strength progression via e1RM).
 */
export function calculateE1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return round2(weightKg);
  return round2(weightKg * (1 + reps / 30));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
