# FitTrack — Монорепо

Персонализированное фитнес-приложение: 12-недельная детерминированная программа, RIR-авторегуляция, трёхтировая система питания, аналитика.

## Структура

```
sport/
├── fittrack-api/     — NestJS backend (PostgreSQL + TypeORM + Redis/Bull)
├── fittrack-web/     — Next.js 14 frontend (App Router + RTK Query)
├── architecture.md   — архитектура
├── implementation.md — поэтапный план
├── sport-research.md — научная база
├── context.md        — журнал изменений
└── CLAUDE.md         — правила проекта
```

## Первый запуск

### 1. PostgreSQL — создать БД

```bash
# Войти под суперюзером (замените на ваш пароль)
psql -U postgres

CREATE DATABASE fittrack;
\q
```

### 2. Backend

```bash
cd fittrack-api

# Проверить/обновить пароль PG в .env:
# DATABASE_USER=postgres
# DATABASE_PASSWORD=<ваш_пароль>

# Запустить начальную миграцию (создаст 17 таблиц)
npm run migration:run

# Запуск dev-сервера
npm run start:dev
# → http://localhost:3001/api/v1
```

### 3. Frontend

```bash
cd fittrack-web

# Запуск dev-сервера
npm run dev
# → http://localhost:3000
```

### 4. Redis (опционально для Этапа 0, нужен для Этапов 15-16)

- Windows: https://github.com/microsoftarchive/redis/releases (устаревший) или через WSL/Docker
- Docker: `docker run -d -p 6379:6379 redis:7-alpine`

## 🐳 Production (Docker)

Вся стэк (PostgreSQL + Redis + API + Web) собирается одной командой:

```bash
# 1. Скопируйте и заполните env
cp .env.production.example .env
# Обязательно задайте JWT_ACCESS_SECRET и JWT_REFRESH_SECRET
# Сгенерировать: openssl rand -hex 32

# 2. Собрать и запустить всё
docker compose up -d --build

# 3. Логи
docker compose logs -f api web

# 4. Остановить
docker compose down

# Полный сброс (с БД)
docker compose down -v
```

После запуска:
- Frontend: http://localhost:3000 (или через Caddy на http://localhost:8080)
- API: http://localhost:3001/api/v1 (или через Caddy на http://localhost:8080/api/v1)
- PostgreSQL: localhost:5432 (можно сменить через `POSTGRES_EXPOSED_PORT` в .env, если порт занят локальным PG)
- Redis: localhost:6379 (можно сменить через `REDIS_EXPOSED_PORT`)
- Caddy reverse-proxy: http://localhost:8080 (HTTP) / https://localhost:8443 (если задан `DOMAIN`)
- Prometheus metrics: http://localhost:3001/metrics (только private IP, через Caddy)

Миграции применяются автоматически при старте контейнера API (ждёт postgres → `node scripts/migrate.js` → `node dist/main.js`).

### Production hardening — что уже включено

| Слой | Реализация |
|------|------------|
| Rate limiting | `@nestjs/throttler`: глобально 100/min/IP, `/auth/login` 5/min, `/auth/register` 3/min, `/auth/refresh` 10/min. 429 c локализованным сообщением. |
| Security headers | `helmet` (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy). Body-parser лимит 1MB. `trust proxy` для X-Forwarded-For. |
| Logging | `nestjs-pino`: JSON в prod, pretty в dev. request-id correlation, redact для password/refreshToken/Authorization. |
| Metrics | `prom-client` /metrics: default Node + `fittrack_auth_attempts_total{endpoint,result}`, `fittrack_programs_generated_total`, `fittrack_progress_logs_total{type}`, `fittrack_http_request_duration_seconds`. |
| PG backup | `prodrigestivill/postgres-backup-local`: ежедневный pg_dump в named volume `postgres-backups`, ротация 7d/4w/6m. Restore: `gunzip < backups/last/fittrack-*.sql.gz \| psql -U postgres fittrack`. |
| HTTPS | Caddy: пустой `DOMAIN` → :80 без TLS (local). Задайте `DOMAIN=app.example.com` и `ACME_EMAIL` → автоматический Let's Encrypt. |
| CI/CD | `.github/workflows/ci.yml`: api (lint+unit+e2e c PG service), web (type-check+build), docker-build (cache-from gha). |

### Особенности Docker-сборки

| Аспект | Решение |
|--------|---------|
| Backend образ | Multi-stage: deps → builder → prod-deps → runtime (node:20-alpine). Финал ~150 MB. |
| Frontend образ | Next.js `output: 'standalone'` — собирает минимальный `.next/standalone` + `server.js`. Финал ~200 MB. |
| Безопасность | Оба контейнера запускаются под non-root user (`nestjs`/`nextjs`). |
| Graceful shutdown | `tini` как PID 1 — корректно проксирует SIGTERM для закрытия Bull connections. |
| Healthchecks | `pg_isready` для postgres, `redis-cli ping` для redis. API ждёт оба через `depends_on.condition`. |
| Секреты | `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` обязательны (`${...:?}`) — compose упадёт без них. |

## Полезные команды

### Backend

```bash
npm run start:dev          # разработка
npm run build              # сборка
npm run test               # unit-тесты (387 шт)
npm run test:cov           # с coverage отчётом (текущее: 76% statements / 78% lines)
npm run test:watch         # watch режим
npm run test:e2e           # 27 e2e-тестов (supertest, живая PG); см. fittrack-api/.env.test.example
npm run migration:run      # применить миграции
npm run migration:revert   # откатить последнюю
npm run migration:create src/migrations/MyName   # создать пустую миграцию
```

#### Coverage breakdown

| Модуль | Lines | Заметка |
|--------|-------|---------|
| training-engine | 90% | Pure-логика, 71 тест |
| profile/calculators | 100% | Mifflin-St Jeor + activity factor |
| body-type/calculators | 95% | Z-scoring + classifier |
| nutrition/calculators | 96% | Calories + macros с safeguards |
| alerts/detectors | 92% | 4 чистых детектора |
| services (10 шт) | 70-90% | Mock-based unit-tests |
| controllers (11 шт) | 95-100% | Smoke-tests с mock services |
| DTOs/modules | низко | Покрываются e2e (стадия 18) |

### Frontend

```bash
npm run dev          # разработка
npm run build        # сборка
npm run type-check   # проверка типов без сборки
npm run lint
```

## Прогресс по этапам

См. [implementation.md](implementation.md).

| # | Этап | Статус |
|---|------|--------|
| 0 | Инициализация (NestJS + Next.js + PostgreSQL) | ✅ |
| 1 | UserModule (auth) | ✅ |
| 2 | PreScreeningModule (PAR-Q+) | ✅ |
| 3 | ProfileModule | ✅ |
| 4 | BodyTypeModule | ✅ |
| 5 | AvatarModule | ✅ |
| 6 | TrainingEngine | ✅ |
| 7 | TrainingModule | ✅ |
| 8 | ProgressModule | ✅ |
| 9 | NutritionModule | ✅ |
| 10 | AnalyticsModule | ✅ |
| 11 | AlertsModule | ✅ |
| 12 | Frontend каркас (types/api/ui/layout) | ✅ |
| 13 | Frontend страницы (auth/onboarding/dashboard/training/nutrition/progress/alerts/avatar/settings) | ✅ |
| 14 | Visualization (Recharts: 10 charts + transforms) | ✅ |
| 15 | Bull jobs (6 queues + cron + listener) | ✅ |
| 16 | Redis cache (CacheModule + 4 услуги cached + invalidation listener) | ✅ |
| 17 | Tests + polish (387 unit-тестов, 77% coverage) | ✅ |
| 18 | Docker (compose + Dockerfiles + auto-migrations) | ✅ |

**🎉 Все 18 этапов завершены. Проект готов к production-деплою.**

## Документация

- [architecture.md](architecture.md) — модули, БД, API, RTK Query
- [implementation.md](implementation.md) — пошаговая реализация с чеклистами
- [sport-research.md](sport-research.md) — научная база (RIR/RPE, формулы, фазы)
- [CLAUDE.md](CLAUDE.md) — правила проекта, модели для задач
