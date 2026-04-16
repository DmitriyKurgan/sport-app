import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { IsNull, Repository } from 'typeorm';
import { AlertsService } from '../../alerts/alerts.service';
import { User } from '../../user/user.entity';
import { JOB_NAMES, QUEUE_NAMES } from '../queues';

interface RunDetectorsPayload {
  userId: string;
}

@Processor(QUEUE_NAMES.ALERTS)
export class AlertsProcessor {
  private readonly logger = new Logger(AlertsProcessor.name);

  constructor(
    private readonly alertsService: AlertsService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /** Запуск детекторов для одного пользователя. */
  @Process(JOB_NAMES.RUN_ALERT_DETECTORS)
  async runForUser(job: Job<RunDetectorsPayload>): Promise<void> {
    const { userId } = job.data;
    try {
      const alerts = await this.alertsService.runAllDetectors(userId);
      if (alerts.length > 0) {
        this.logger.log(
          `User ${userId}: ${alerts.length} new alert(s) — ${alerts.map((a) => a.type).join(', ')}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Detectors failed for user ${userId}: ${(err as Error).message}`,
      );
      throw err;
    }
  }

  /** Cron: пробежать по всем активным пользователям. */
  @Process(JOB_NAMES.ALL_USERS_ALERT_DETECTORS)
  async runForAllUsers(): Promise<void> {
    const users = await this.userRepo.find({
      where: { isActive: true, deletedAt: IsNull() },
      select: { id: true },
    });
    this.logger.log(`Running detectors for ${users.length} active user(s)`);

    for (const u of users) {
      try {
        await this.alertsService.runAllDetectors(u.id);
      } catch (err) {
        this.logger.warn(
          `Detectors failed for user ${u.id}: ${(err as Error).message}`,
        );
        // Не пробрасываем — иначе остановим обход
      }
    }
  }
}
