/**
 * Входные данные для scoring: собираются сервисом из ProfileModule + ProgressModule + BodyMeasurements.
 * Все поля опциональные кроме weightKg/heightCm (они есть всегда из ProfileModule).
 */
export interface ScoringInputs {
  weightKg: number;
  heightCm: number;

  /** Окружность талии (cm). Улучшает точность adiposity, если есть. */
  waistCm?: number | null;

  /** Окружности (cm). Улучшают точность muscularity. */
  chestCm?: number | null;
  bicepsCm?: number | null;

  /** Лучший e1RM по каждому main_lift (кг). Нужен для muscularity. */
  e1rmSquatKg?: number | null;
  e1rmBenchKg?: number | null;
  e1rmDeadliftKg?: number | null;
}
