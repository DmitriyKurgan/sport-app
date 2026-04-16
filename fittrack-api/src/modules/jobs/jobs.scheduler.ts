import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bull';
import { DEFAULT_JOB_OPTS, JOB_NAMES, QUEUE_NAMES } from './queues';

/**
 * Cron-расписание для всех периодических задач.
 * Сами тяжёлые операции выполняются в processors — здесь только enqueue.
 */
@Injectable()
export class JobsScheduler {
  private readonly logger = new Logger(JobsScheduler.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.ALERTS) private readonly alertsQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NUTRITION) private readonly nutritionQueue: Queue,
    @InjectQueue(QUEUE_NAMES.REPORTS) private readonly reportsQueue: Queue,
    @InjectQueue(QUEUE_NAMES.AUTH) private readonly authQueue: Queue,
  ) {}

  /** Каждый день в 06:00 — пробежать детекторами по всем юзерам. */
  @Cron('0 6 * * *', { name: 'daily-alerts-detectors', timeZone: 'Europe/Moscow' })
  async dailyAlertsRun(): Promise<void> {
    this.logger.log('Cron: enqueue all-users-alert-detectors');
    await this.alertsQueue.add(
      JOB_NAMES.ALL_USERS_ALERT_DETECTORS,
      {},
      DEFAULT_JOB_OPTS,
    );
  }

  /** Каждое воскресенье в 20:00 — recalibrate питания по weight trend. */
  @Cron('0 20 * * 0', { name: 'weekly-nutrition-recalibrate', timeZone: 'Europe/Moscow' })
  async weeklyNutritionRecalibrate(): Promise<void> {
    this.logger.log('Cron: enqueue recalibrate-nutrition-all');
    await this.nutritionQueue.add(
      JOB_NAMES.RECALIBRATE_NUTRITION_ALL,
      {},
      DEFAULT_JOB_OPTS,
    );
  }

  /** Каждый понедельник в 09:00 — weekly-report для всех. */
  @Cron('0 9 * * 1', { name: 'weekly-report', timeZone: 'Europe/Moscow' })
  async weeklyReport(): Promise<void> {
    this.logger.log('Cron: enqueue weekly-report-all');
    await this.reportsQueue.add(JOB_NAMES.WEEKLY_REPORT_ALL, {}, DEFAULT_JOB_OPTS);
  }

  /** Каждый день в 03:00 — чистка просроченных refresh-token-хэшей. */
  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'cleanup-tokens' })
  async cleanupTokens(): Promise<void> {
    this.logger.log('Cron: enqueue cleanup-expired-tokens');
    await this.authQueue.add(JOB_NAMES.CLEANUP_EXPIRED_TOKENS, {}, DEFAULT_JOB_OPTS);
  }
}
