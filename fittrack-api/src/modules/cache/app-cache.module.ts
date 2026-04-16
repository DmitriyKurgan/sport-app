import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Keyv } from 'keyv';
import { AppCacheService } from './app-cache.service';
import { CacheInvalidationListener } from './cache.listener';

/**
 * Глобальный CacheModule на Redis (через @keyv/redis).
 *
 * Когда Redis недоступен — Keyv фолбэкает в in-memory, приложение не падает
 * (но кэш не работает между процессами). AppCacheService логирует ошибки.
 */
@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('redis.host', 'localhost');
        const port = config.get<number>('redis.port', 6379);
        const password = config.get<string>('redis.password');
        const url = password
          ? `redis://:${encodeURIComponent(password)}@${host}:${port}`
          : `redis://${host}:${port}`;

        const keyv = new Keyv({ store: new KeyvRedis(url) });
        // Если Redis упал — не валим запросы; AppCacheService сам залогирует и обойдётся
        keyv.on('error', () => {
          // молча игнорируем (логирование уже делает AppCacheService.get/set)
        });
        return { stores: [keyv] };
      },
    }),
  ],
  providers: [AppCacheService, CacheInvalidationListener],
  exports: [AppCacheService, CacheModule],
})
export class AppCacheModule {}
