import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  BODY_MEASUREMENT_ADDED,
  BodyMeasurementAddedEvent,
  SESSION_RPE_LOGGED,
  SessionRPELoggedEvent,
} from '../progress/events';
import { AppCacheService } from './app-cache.service';
import { cacheKeys } from './cache-keys';

/**
 * Централизованная инвалидация кэша на доменные события.
 *
 * progress.logged уже инвалидирует прямо в ProgressLogService.logSet
 * (горячий путь, чтобы пользователь сразу увидел свежие данные).
 *
 * Здесь — побочные события, которые тоже сбрасывают кэш:
 *   - session-RPE: дашборд (внутренний load), weekly report
 *   - body measurement: дашборд (вес-карточка)
 */
@Injectable()
export class CacheInvalidationListener {
  private readonly logger = new Logger(CacheInvalidationListener.name);

  constructor(private readonly cache: AppCacheService) {}

  @OnEvent(SESSION_RPE_LOGGED, { async: true })
  async onSessionRpeLogged(event: SessionRPELoggedEvent): Promise<void> {
    await this.cache.delMany([
      cacheKeys.dashboard(event.userId),
      cacheKeys.weeklyReport(event.userId),
    ]);
  }

  @OnEvent(BODY_MEASUREMENT_ADDED, { async: true })
  async onBodyMeasurementAdded(event: BodyMeasurementAddedEvent): Promise<void> {
    await this.cache.delMany([
      cacheKeys.dashboard(event.userId),
      cacheKeys.weeklyReport(event.userId),
    ]);
  }
}
