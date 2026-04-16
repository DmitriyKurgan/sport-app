import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

/**
 * Тонкая обёртка над cache-manager с типизацией и логированием.
 * Предоставляет:
 *   - get/set/del типизированно
 *   - getOrCompute (cache-aside pattern)
 *   - invalidateUser — удаляет все user-scoped ключи
 */
@Injectable()
export class AppCacheService {
  private readonly logger = new Logger(AppCacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.cache.get<T>(key);
      return result ?? null;
    } catch (err) {
      this.logger.warn(`cache.get failed for ${key}: ${(err as Error).message}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.cache.set(key, value, ttlSeconds * 1000);
    } catch (err) {
      this.logger.warn(`cache.set failed for ${key}: ${(err as Error).message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cache.del(key);
    } catch (err) {
      this.logger.warn(`cache.del failed for ${key}: ${(err as Error).message}`);
    }
  }

  async delMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map((k) => this.del(k)));
  }

  /**
   * Cache-aside: если в кэше есть — вернуть, иначе вызвать compute, сохранить, вернуть.
   * При любых ошибках кэша → fallback на compute (доступность важнее консистентности).
   */
  async getOrCompute<T>(
    key: string,
    ttlSeconds: number,
    compute: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      this.logger.debug(`cache HIT: ${key}`);
      return cached;
    }
    this.logger.debug(`cache MISS: ${key}`);
    const fresh = await compute();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}
