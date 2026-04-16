import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  BODY_MEASUREMENT_ADDED,
  BodyMeasurementAddedEvent,
  PROGRESS_LOGGED,
  ProgressLoggedEvent,
  SESSION_RPE_LOGGED,
  SessionRPELoggedEvent,
} from '../progress/events';
import { AlertsService } from './alerts.service';

/**
 * Подписчики на события ProgressModule.
 * При каждом важном изменении — асинхронно запускаем все детекторы.
 *
 * AsyncLocalStorage / контекст не нужен — userId приходит в payload.
 * Дедупликация на уровне AlertsService гарантирует, что повторного спама не будет.
 */
@Injectable()
export class AlertsListener {
  private readonly logger = new Logger(AlertsListener.name);

  constructor(private readonly alertsService: AlertsService) {}

  @OnEvent(PROGRESS_LOGGED, { async: true })
  async onProgressLogged(event: ProgressLoggedEvent): Promise<void> {
    try {
      await this.alertsService.runAllDetectors(event.userId);
    } catch (err) {
      this.logger.error(`Detectors failed on progress.logged: ${(err as Error).message}`);
    }
  }

  @OnEvent(SESSION_RPE_LOGGED, { async: true })
  async onSessionRpeLogged(event: SessionRPELoggedEvent): Promise<void> {
    try {
      await this.alertsService.runAllDetectors(event.userId);
    } catch (err) {
      this.logger.error(
        `Detectors failed on session.rpe.logged: ${(err as Error).message}`,
      );
    }
  }

  @OnEvent(BODY_MEASUREMENT_ADDED, { async: true })
  async onBodyMeasurementAdded(event: BodyMeasurementAddedEvent): Promise<void> {
    try {
      await this.alertsService.runAllDetectors(event.userId);
    } catch (err) {
      this.logger.error(
        `Detectors failed on body.measurement.added: ${(err as Error).message}`,
      );
    }
  }
}
