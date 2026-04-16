/**
 * Consistency score = completedDays / plannedDays * 100.
 * Если plannedDays=0 → 0 (защита от деления на ноль).
 */
export function calculateConsistencyScore(
  completedDays: number,
  plannedDays: number,
): number {
  if (plannedDays <= 0) return 0;
  const pct = (completedDays / plannedDays) * 100;
  return Math.round(Math.min(100, Math.max(0, pct)));
}
