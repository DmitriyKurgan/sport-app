import { AppCacheService } from '../app-cache.service';

/**
 * Мок AppCacheService для unit-тестов.
 * getOrCompute всегда вызывает compute (не кэширует) — тесты должны
 * проверять реальную логику, а не cache-hit поведение.
 */
export const mockAppCacheService = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  delMany: jest.fn().mockResolvedValue(undefined),
  getOrCompute: jest.fn((_key: string, _ttl: number, compute: () => Promise<unknown>) =>
    compute(),
  ),
};

export const cacheServiceProvider = {
  provide: AppCacheService,
  useValue: mockAppCacheService,
};
