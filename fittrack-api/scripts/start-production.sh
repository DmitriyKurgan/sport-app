#!/bin/sh
# Entrypoint для production-контейнера.
# 1. Ждём пока PG станет доступен.
# 2. Применяем миграции (idempotent).
# 3. Запускаем API.

set -e

echo "[start] waiting for postgres at $DATABASE_HOST:$DATABASE_PORT..."
until node -e "
const net = require('net');
const sock = net.connect($DATABASE_PORT, '$DATABASE_HOST');
sock.on('connect', () => { sock.end(); process.exit(0); });
sock.on('error', () => process.exit(1));
" 2>/dev/null; do
  sleep 1
done
echo "[start] postgres ready"

echo "[start] running migrations..."
node scripts/migrate.js

echo "[start] launching api..."
exec node dist/main.js
