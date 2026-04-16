#!/bin/sh
# Production entrypoint:
# 1) wait for Postgres (parses DATABASE_URL or DATABASE_HOST/PORT),
# 2) run migrations,
# 3) start the API.

set -e

# Determine PG host/port: prefer DATABASE_URL, fall back to DATABASE_HOST/PORT.
if [ -n "$DATABASE_URL" ]; then
  PGHOST=$(node -e "const u=new URL(process.env.DATABASE_URL); console.log(u.hostname)")
  PGPORT=$(node -e "const u=new URL(process.env.DATABASE_URL); console.log(u.port||5432)")
else
  PGHOST="${DATABASE_HOST:-localhost}"
  PGPORT="${DATABASE_PORT:-5432}"
fi

echo "[start] waiting for postgres at $PGHOST:$PGPORT..."
until node -e "
const net=require('net');
const s=net.connect($PGPORT,'$PGHOST');
s.on('connect',()=>{s.end();process.exit(0)});
s.on('error',()=>process.exit(1));
" 2>/dev/null; do
  sleep 1
done
echo "[start] postgres ready"

echo "[start] running migrations..."
node scripts/migrate.js

echo "[start] launching api..."
exec node dist/main.js
