import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { NutritionService } from '../../nutrition/nutrition.service';
import { BodyMeasurementService } from '../../progress/services/body-measurement.service';
import { User } from '../../user/user.entity';
import { JOB_NAMES, QUEUE_NAMES } from '../queues';

/**
 * Cron-задача: для каждого активного пользователя запросить 14-day weight trend
 * и вызвать NutritionService.recalibrate().
 */
@Processor(QUEUE_NAMES.NUTRITION)
export class NutritionProcessor {
  private readonly logger = new Logger(NutritionProcessor.name);

  constructor(
    private readonly nutritionService: NutritionService,
    private readonly bodyMeasurementService: BodyMeasurementService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Process(JOB_NAMES.RECALIBRATE_NUTRITION_ALL)
  async recalibrateAll(): Promise<void> {
    const users = await this.userRepo.find({
      where: { isActive: true, deletedAt: IsNull() },
      select: { id: true },
    });
    this.logger.log(`Recalibrating nutrition for ${users.length} active user(s)`);

    let recalibrated = 0;
    for (const u of users) {
      try {
        const trend = await this.bodyMeasurementService.getWeightTrend(u.id, 14);
        if (trend.length < 7) continue; // мало данных для тренда

        const first = trend[0].avg14d ?? trend[0].weightKg;
        const last = trend[trend.length - 1].avg14d ?? trend[trend.length - 1].weightKg;
        const delta = Math.round((last - first) * 10) / 10;

        await this.nutritionService.recalibrate(u.id, delta);
        recalibrated++;
      } catch (err) {
        // Например, у юзера нет активного плана — нормально, пропускаем
        this.logger.debug(
          `Recalibrate skipped for user ${u.id}: ${(err as Error).message}`,
        );
      }
    }
    this.logger.log(`Nutrition recalibrated for ${recalibrated}/${users.length} user(s)`);
  }
}
