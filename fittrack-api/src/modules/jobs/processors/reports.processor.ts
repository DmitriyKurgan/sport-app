import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AnalyticsService } from '../../analytics/analytics.service';
import { User } from '../../user/user.entity';
import { JOB_NAMES, QUEUE_NAMES } from '../queues';

/**
 * Cron-задача: пересчитать weekly-report для каждого активного пользователя
 * (попадает в кэш для быстрого открытия дашборда понедельника).
 *
 * В будущем можно добавить email-нотификацию.
 */
@Processor(QUEUE_NAMES.REPORTS)
export class ReportsProcessor {
  private readonly logger = new Logger(ReportsProcessor.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Process(JOB_NAMES.WEEKLY_REPORT_ALL)
  async generateForAll(): Promise<void> {
    const users = await this.userRepo.find({
      where: { isActive: true, deletedAt: IsNull() },
      select: { id: true },
    });
    this.logger.log(`Generating weekly reports for ${users.length} user(s)`);

    let generated = 0;
    for (const u of users) {
      try {
        await this.analyticsService.getWeeklyReport(u.id);
        generated++;
      } catch {
        // у некоторых нет программы или данных — пропускаем тихо
      }
    }
    this.logger.log(`Weekly reports generated: ${generated}/${users.length}`);
  }
}
