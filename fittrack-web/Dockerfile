# ============================================================
# Stage 1: deps — зависимости (с dev для сборки)
# ============================================================
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ============================================================
# Stage 2: builder — Next.js build (создаёт .next/standalone)
# ============================================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* embedded в JS при build-time.
# В docker-compose передаётся через build.args.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ============================================================
# Stage 3: runtime — минимальный образ (standalone)
# ============================================================
FROM node:20-alpine AS runtime
WORKDIR /app

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
RUN apk add --no-cache tini

# Копируем standalone bundle (включает server.js + нужные node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
