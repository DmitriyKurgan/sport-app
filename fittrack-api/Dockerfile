# ============================================================
# Stage 1: deps — установка всех зависимостей (dev + prod)
# Этот кэш-слой используется и для build, и для тестов.
# ============================================================
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ============================================================
# Stage 2: builder — компиляция TypeScript
# ============================================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ============================================================
# Stage 3: prod-deps — только production зависимости
# ============================================================
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ============================================================
# Stage 4: runtime — минимальный образ для продакшена
# ============================================================
FROM node:20-alpine AS runtime
WORKDIR /app

# Для безопасности — запускаем не от root
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

# tini: правильная обработка SIGTERM (graceful shutdown Bull/Redis connections)
RUN apk add --no-cache tini

# Копируем только production node_modules + собранный код + scripts (migrate)
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --chown=nestjs:nodejs package.json ./
COPY --chown=nestjs:nodejs scripts ./scripts
RUN chmod +x scripts/start-production.sh

USER nestjs

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

ENTRYPOINT ["/sbin/tini", "--"]
# Default startup: ждёт PG → миграции → запуск API.
# В docker-compose можно переопределить через `command:` для кастомного entry.
CMD ["sh", "scripts/start-production.sh"]
