/**
 * Имена Bull-очередей и job-имён.
 * Используются в @Processor / @InjectQueue / queue.add().
 */
export const QUEUE_NAMES = {
  ALERTS: 'alerts',
  PROGRESSION: 'progression',
  BODY_SCORING: 'body-scoring',
  NUTRITION: 'nutrition',
  REPORTS: 'reports',
  AUTH: 'auth',
} as const;

export const JOB_NAMES = {
  RUN_ALERT_DETECTORS: 'run-alert-detectors',
  ALL_USERS_ALERT_DETECTORS: 'all-users-alert-detectors',
  CHECK_PROGRESSION: 'check-progression',
  RECALCULATE_BODY_SCORING: 'recalculate-body-scoring',
  RECALIBRATE_NUTRITION_ALL: 'recalibrate-nutrition-all',
  WEEKLY_REPORT_ALL: 'weekly-report-all',
  CLEANUP_EXPIRED_TOKENS: 'cleanup-expired-tokens',
} as const;

/** Опции по умолчанию: защита от потери задачи и backoff retries. */
export const DEFAULT_JOB_OPTS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 } as const,
  removeOnComplete: 100,
  removeOnFail: 500,
};
