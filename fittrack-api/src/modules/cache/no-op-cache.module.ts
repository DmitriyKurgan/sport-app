import { Global, Module } from '@nestjs/common';
import { AppCacheService } from './app-cache.service';

/**
 * Заглушка для деплоев без Redis (например, Render free tier без Key-Value addon).
 * getOrCompute всегда вызывает factory; get/set/del — no-op.
 */
class NoopCacheService {
  async get<T>(_: string): Promise<T | null> {
    return null;
  }
  async set<T>(_: string, __: T, ___: number): Promise<void> {}
  async del(_: string): Promise<void> {}
  async delMany(_: string[]): Promise<void> {}
  async getOrCompute<T>(_: string, __: number, compute: () => Promise<T>): Promise<T> {
    return compute();
  }
}

@Global()
@Module({
  providers: [{ provide: AppCacheService, useClass: NoopCacheService }],
  exports: [AppCacheService],
})
export class NoOpCacheModule {}
