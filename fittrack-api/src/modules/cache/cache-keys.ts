/**
 * Канонические ключи кэша.
 * Все ключи за пределами пользователя (catalog, meal templates) — глобальные;
 * пользовательские всегда содержат userId как часть ключа.
 *
 * TTL значения (architecture.md 9.2):
 *   dashboard: 2 мин (агрегированные данные, нужна свежесть)
 *   program:active: 5 мин (редко меняется до завершения тренировки)
 *   records: 5 мин
 *   catalog:exercises: 1 час (обновляется редко через seed)
 */

export const CACHE_TTL = {
  DASHBOARD_SECONDS: 120,
  ACTIVE_PROGRAM_SECONDS: 300,
  RECORDS_SECONDS: 300,
  CATALOG_SECONDS: 3600,
  WEEKLY_REPORT_SECONDS: 600,
} as const;

export const cacheKeys = {
  dashboard: (userId: string) => `dashboard:${userId}`,
  weeklyReport: (userId: string) => `weekly-report:${userId}`,
  activeProgram: (userId: string) => `program:active:${userId}`,
  records: (userId: string) => `records:${userId}`,

  exerciseCatalog: () => 'catalog:exercises:all',
  exerciseCatalogByEquipment: (equipmentAccess: string) =>
    `catalog:exercises:${equipmentAccess}`,
  exerciseBySlug: (slug: string) => `exercise:slug:${slug}`,
};

/**
 * Префиксы для bulk-инвалидации.
 * Используются в CacheService.delByPrefix.
 */
export const cacheKeyPrefixes = {
  userScoped: (userId: string) => [
    `dashboard:${userId}`,
    `weekly-report:${userId}`,
    `program:active:${userId}`,
    `records:${userId}`,
  ],
  catalog: () => ['catalog:', 'exercise:slug:'],
};
