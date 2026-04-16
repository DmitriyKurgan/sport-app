import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Not, Repository } from 'typeorm';
import { User } from '../../user/user.entity';
import { JOB_NAMES, QUEUE_NAMES } from '../queues';

/**
 * Чистка просроченных refresh-token-хэшей.
 * Если updated_at старше 30 дней (за пределами max refresh expiry) — обнуляем.
 */
@Processor(QUEUE_NAMES.AUTH)
export class AuthProcessor {
  private readonly logger = new Logger(AuthProcessor.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Process(JOB_NAMES.CLEANUP_EXPIRED_TOKENS)
  async cleanup(): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const result = await this.userRepo.update(
      {
        refreshTokenHash: Not(IsNull()),
        updatedAt: LessThan(cutoff),
        deletedAt: IsNull(),
      },
      { refreshTokenHash: null },
    );

    if (result.affected) {
      this.logger.log(`Cleared ${result.affected} stale refresh-token-hash(es)`);
    }
  }
}
