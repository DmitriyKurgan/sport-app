import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bull';
import {
  BODY_MEASUREMENT_ADDED,
  BodyMeasurementAddedEvent,
  PROGRESS_LOGGED,
  ProgressLoggedEvent,
  SESSION_RPE_LOGGED,
  SessionRPELoggedEvent,
} from '../progress/events';
import { DEFAULT_JOB_OPTS, JOB_NAMES, QUEUE_NAMES } from './queues';

/**
 * Перехват событий и постановка в очередь.
 *
 * AlertsListener из AlertsModule выполняет детекторы СИНХРОННО — оставляем его
 * для немедленной реакции в конкретной транзакции (UX feedback).
 * Здесь мы дополнительно ставим в очередь "тяжёлые" задачи (progression check),
 * которые могут идти асинхронно с retry/backoff.
 */
@Injectable()
export class JobsListener {
  private readonly logger = new Logger(JobsListener.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.PROGRESSION) private readonly progressionQueue: Queue,
    @InjectQueue(QUEUE_NAMES.BODY_SCORING) private readonly bodyScoringQueue: Queue,
  ) {}

  /**
   * После каждого подхода — если это последний подход в день, нужна будет
   * проверка прогрессии (сделается на complete-day).
   * Сейчас просто триггерим body scoring (т.к. e1RM мог обновиться).
   */
  @OnEvent(PROGRESS_LOGGED, { async: true })
  async onProgressLogged(event: ProgressLoggedEvent): Promise<void> {
    if (event.isWarmup) return;
    await this.bodyScoringQueue.add(
      JOB_NAMES.RECALCULATE_BODY_SCORING,
      { userId: event.userId },
      { ...DEFAULT_JOB_OPTS, attempts: 1 }, // не критично если упадёт
    );
  }

  /** Завершение тренировки → проверить прогрессию для следующей недели. */
  @OnEvent(SESSION_RPE_LOGGED, { async: true })
  async onSessionRpeLogged(event: SessionRPELoggedEvent): Promise<void> {
    await this.progressionQueue.add(
      JOB_NAMES.CHECK_PROGRESSION,
      {
        userId: event.userId,
        trainingDayId: event.trainingDayId,
      },
      DEFAULT_JOB_OPTS,
    );
  }

  /** Новый замер тела → пересчитать body-type + avatar. */
  @OnEvent(BODY_MEASUREMENT_ADDED, { async: true })
  async onBodyMeasurementAdded(event: BodyMeasurementAddedEvent): Promise<void> {
    await this.bodyScoringQueue.add(
      JOB_NAMES.RECALCULATE_BODY_SCORING,
      { userId: event.userId },
      DEFAULT_JOB_OPTS,
    );
  }
}
