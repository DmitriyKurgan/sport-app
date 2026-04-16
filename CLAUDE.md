# Правила проекта FitTrack

## Модели для задач

- **Планирование, архитектура, проектирование, ревью** — Claude Opus 4.6
- **Реализация кода по готовым инструкциям** — Claude Sonnet 4.6

## Контекстный файл

- Файл `context.md` — единый источник правды о текущем состоянии проекта
- При каждом ключевом изменении (новый модуль, миграция, изменение API, рефакторинг) — обновлять `context.md`
- Формат записи: дата, что изменено, почему, какие файлы затронуты

## Архитектурные документы

- `architecture.md` — детальная архитектура по модулям, схема БД, API
- `implementation.md` — пошаговый план реализации с чеклистами
- `sport-research.md` — научная база (нормы, формулы, безопасность, авторегуляция)
- Перед началом работы над модулем — сверяться со всеми тремя файлами
- Любые изменения логики тренировок/питания должны опираться на `sport-research.md`

## Стек

- Backend: NestJS + TypeORM + PostgreSQL
- Frontend: Next.js 14+ (App Router) + RTK Query
- Charts: Recharts
- Auth: JWT + Refresh tokens
- Cache: Redis (опционально)
- Queue: Bull (для фоновых задач)

## Соглашения по коду

- Backend: модульная структура NestJS, каждый модуль в своей папке
- Именование: camelCase для переменных/функций, PascalCase для классов/интерфейсов
- DTOs: class-validator для валидации
- API: REST, версионирование через /api/v1/
- Миграции: TypeORM migrations, не synchronize в production
- Тесты: unit-тесты для сервисов, e2e для контроллеров

## Git

- Conventional commits: feat:, fix:, refactor:, docs:, chore:
- Ветки: feature/, fix/, refactor/ от develop
