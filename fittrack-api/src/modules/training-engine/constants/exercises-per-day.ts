/** Сколько упражнений помещается в сессию по длительности. */
export const EXERCISES_PER_DAY: Record<number, number> = {
  30: 3,
  45: 4,
  60: 5,
  75: 6,
  90: 7,
};

export function getExercisesPerDay(sessionDurationMinutes: number): number {
  return EXERCISES_PER_DAY[sessionDurationMinutes] ?? 5;
}
