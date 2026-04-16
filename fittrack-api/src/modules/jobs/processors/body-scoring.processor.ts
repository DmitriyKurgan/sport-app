import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AvatarService } from '../../avatar/avatar.service';
import { BodyTypeService } from '../../body-type/body-type.service';
import { JOB_NAMES, QUEUE_NAMES } from '../queues';

interface Payload {
  userId: string;
}

/**
 * После обновления профиля или замеров — пересчитать body-type scoring + avatar.
 * Триггерится из event listener (см. JobsListener).
 */
@Processor(QUEUE_NAMES.BODY_SCORING)
export class BodyScoringProcessor {
  private readonly logger = new Logger(BodyScoringProcessor.name);

  constructor(
    private readonly bodyTypeService: BodyTypeService,
    private readonly avatarService: AvatarService,
  ) {}

  @Process(JOB_NAMES.RECALCULATE_BODY_SCORING)
  async recalculate(job: Job<Payload>): Promise<void> {
    const { userId } = job.data;
    try {
      // Сначала body-type (avatar зависит от scoring)
      await this.bodyTypeService.recalculate(userId);
      await this.avatarService.recalculate(userId);
      this.logger.log(`Body scoring + avatar recalculated for user ${userId}`);
    } catch (err) {
      this.logger.error(
        `Body scoring recalc failed for user ${userId}: ${(err as Error).message}`,
      );
      throw err;
    }
  }
}
