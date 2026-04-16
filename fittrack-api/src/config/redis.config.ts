import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  // Если REDIS_ENABLED=false (или REDIS_HOST пустой) — Bull queues и Redis-кэш отключаются;
  // приложение работает в standalone-режиме (in-memory кэш, события только через EventEmitter, без cron/jobs).
  enabled: process.env.REDIS_ENABLED !== 'false' && !!process.env.REDIS_HOST,
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
}));
