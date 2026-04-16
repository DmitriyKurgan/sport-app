/**
 * Internal Load = sessionRPE × durationMinutes.
 * Источник: Foster et al, session-RPE метод мониторинга внутренней нагрузки.
 */
export function calculateInternalLoad(sessionRPE: number, durationMinutes: number): number {
  if (sessionRPE < 0 || durationMinutes <= 0) return 0;
  return Math.round(sessionRPE * durationMinutes);
}
