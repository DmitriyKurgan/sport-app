# FitTrack

A personalized fitness web app: 12-week training programs with RIR-based autoregulation, three-tier nutrition planning, body composition analytics, and a 3D avatar that evolves with your progress.

## Features

- **PAR-Q+ pre-screening** before any program is generated.
- **12-week deterministic program** with three mesocycles (adaptation → progression → peaking) and a deload week at weeks 4, 8, 12.
- **RIR autoregulation** (Reps In Reserve) with double progression — weights advance only when target reps are hit at the target RIR.
- **Body type classifier** (ectomorph / mesomorph / endomorph / hybrid) computed from anthropometrics with z-scoring.
- **3D avatar** parameterised by your measurements — rotates with your mouse and updates as you progress.
- **Three-tier nutrition** (budget / standard / advanced) with auto-recalibration based on weight trend.
- **Workout flow**: start → log sets with weight/reps/RIR → finish, with rest timer and historical reference.
- **Analytics dashboard**: weekly volume load, e1RM trends, internal load (RPE × duration), consistency score.
- **Weekly insights** (14 rules) — improvements, blockers, and recommendations.
- **Alerts** for plateau, overreaching, missed sessions and weight trend deviations.
- **Exercise videos**: every exercise has a one-click YouTube technique search.

## Tech stack

| Layer | Stack |
|-------|-------|
| Backend | NestJS 10, TypeORM, PostgreSQL 15, JWT (access + refresh), Bull queues, Redis |
| Frontend | Next.js 14 (App Router), React 18, Redux Toolkit + RTK Query, Tailwind, Recharts, react-three-fiber |
| Infra | Docker Compose (postgres, redis, api, web, caddy, postgres-backup), Caddy reverse-proxy with auto Let's Encrypt |
| Observability | nestjs-pino (JSON logs), prom-client (Prometheus metrics) |

## Quick start (Docker — recommended)

The full stack (PostgreSQL + Redis + API + Web + Caddy + daily backup) starts with one command.

```bash
# 1. Copy env template and set secrets
cp .env.production.example .env

# Required: generate two secrets
#   openssl rand -hex 32
# and put them in .env as JWT_ACCESS_SECRET and JWT_REFRESH_SECRET

# 2. Build and start
docker compose up -d --build

# 3. Tail logs
docker compose logs -f api web

# 4. Stop
docker compose down

# 5. Full reset (drops the database)
docker compose down -v
```

After startup:

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:3001/api/v1 |
| Reverse-proxy (Caddy) | http://localhost:80 |
| Prometheus metrics | http://localhost:3001/metrics (private network only via Caddy) |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

> If a port is already used by something else on your host (a local Postgres or Redis service), set `POSTGRES_EXPOSED_PORT`, `REDIS_EXPOSED_PORT`, `CADDY_HTTP_PORT`, etc. in `.env`.

Database migrations and seed data (exercises catalog, meal templates) are applied automatically on API startup.

## Local development (without Docker)

You need Node.js 20+, PostgreSQL 15+ and (optionally) Redis 7+ running locally.

### 1. Create the database

```bash
psql -U postgres
CREATE DATABASE fittrack;
\q
```

### 2. Backend

```bash
cd fittrack-api

# Edit fittrack-api/.env with your DB password and JWT secrets
# (use .env.production.example at repo root as a reference)

npm install
npm run migration:run     # creates 17 tables and seeds the catalog
npm run start:dev         # http://localhost:3001/api/v1
```

### 3. Frontend

```bash
cd fittrack-web
npm install
npm run dev               # http://localhost:3000
```

### 4. Redis (optional in dev — required for Bull queues and Redis cache)

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

## HTTPS in production

Caddy is preconfigured to obtain a free Let's Encrypt certificate automatically.

In `.env` set:

```
CADDY_SITE=app.example.com
ACME_EMAIL=you@example.com
CADDY_HTTP_PORT=80
CADDY_HTTPS_PORT=443
```

…and point the DNS A-record of `app.example.com` to your server IP. Caddy will provision and renew the certificate without further action.

For local/staging without TLS leave `CADDY_SITE=:80`.

## Backup & restore

A `postgres-backup` container runs daily `pg_dump` into a named volume `postgres-backups` and rotates 7 daily / 4 weekly / 6 monthly snapshots.

Restore the latest backup:

```bash
docker compose exec postgres-backup ls /backups/last
# pick the file, e.g. fittrack-20260415-030000.sql.gz

docker compose exec postgres-backup sh -c \
  'gunzip < /backups/last/fittrack-LATEST.sql.gz | psql -h postgres -U postgres -d fittrack'
```

## Useful commands

### Backend

```bash
npm run start:dev          # dev server with hot reload
npm run build              # compile to dist/
npm test                   # unit tests
npm run test:cov           # tests with coverage report
npm run test:e2e           # end-to-end tests (requires running PostgreSQL — see fittrack-api/.env.test.example)
npm run migration:run      # apply pending migrations
npm run migration:revert   # roll back the last migration
npm run migration:create src/migrations/MyName   # scaffold a new empty migration
```

### Frontend

```bash
npm run dev          # dev server
npm run build        # production build
npm run type-check   # TypeScript check without emit
npm run lint
```

## Deploy to production

The recommended free-tier setup is **Render (API + PostgreSQL) + Vercel (frontend)**. The repo includes a `render.yaml` Blueprint and a `vercel.json` config so the whole pipeline is one click on each service.

See [`DEPLOY.md`](DEPLOY.md) for the step-by-step guide.

## Documentation

- [`DEPLOY.md`](DEPLOY.md) — production deploy on Render + Vercel
- [`architecture.md`](architecture.md) — module map, database schema, API endpoints
- [`sport-research.md`](sport-research.md) — scientific basis (RIR/RPE, formulas, training phases, safety)
