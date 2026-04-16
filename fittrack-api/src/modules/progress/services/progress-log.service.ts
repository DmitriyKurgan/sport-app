import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { AppCacheService, cacheKeys, CACHE_TTL } from '../../cache';
import { MetricsService } from '../../metrics';
import { TrainingDay } from '../../training/entities';
import { TrainingEngineService } from '../../training-engine';
import { CreateProgressLogDto } from '../dto/create-progress-log.dto';
import { LogSessionRPEDto } from '../dto/log-session-rpe.dto';
import { ProgressLogsQueryDto } from '../dto/query.dto';
import {
  PersonalRecordDto,
  ProgressLogResponseDto,
  SessionRPEResponseDto,
  WeeklyAggregateDto,
} from '../dto/response.dto';
import { ProgressLog, SessionRPELog } from '../entities';
import {
  PROGRESS_LOGGED,
  ProgressLoggedEvent,
  SESSION_RPE_LOGGED,
  SessionRPELoggedEvent,
} from '../events';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response.interface';

@Injectable()
export class ProgressLogService {
  private readonly logger = new Logger(ProgressLogService.name);

  constructor(
    @InjectRepository(ProgressLog)
    private readonly logRepo: Repository<ProgressLog>,
    @InjectRepository(SessionRPELog)
    private readonly sessionRpeRepo: Repository<SessionRPELog>,
    @InjectRepository(TrainingDay)
    private readonly trainingDayRepo: Repository<TrainingDay>,
    private readonly engine: TrainingEngineService,
    private readonly events: EventEmitter2,
    private readonly cache: AppCacheService,
    private readonly metrics: MetricsService,
  ) {}

  // ============= logSet =============

  async logSet(userId: string, dto: CreateProgressLogDto): Promise<ProgressLogResponseDto> {
    if (dto.trainingDayId) {
      await this.assertOwnsDay(dto.trainingDayId, userId);
    }

    const isWarmup = dto.isWarmup ?? false;
    const estimated1rm = isWarmup
      ? null
      : this.engine.calculateE1RM(dto.weightKg, dto.reps);
    const volumeLoad = isWarmup ? null : dto.weightKg * dto.reps;

    const log = this.logRepo.create({
      userId,
      exerciseId: dto.exerciseId,
      trainingDayId: dto.trainingDayId ?? null,
      dayExerciseId: dto.dayExerciseId ?? null,
      setNumber: dto.setNumber,
      weightKg: dto.weightKg,
      reps: dto.reps,
      rir: dto.rir ?? null,
      rpe: dto.rpe ?? null,
      estimated1rm,
      volumeLoad,
      isWarmup,
      notes: dto.notes ?? null,
      performedAt: new Date(),
    });
    const saved = await this.logRepo.save(log);

    const event: ProgressLoggedEvent = {
      userId: saved.userId,
      exerciseId: saved.exerciseId,
      trainingDayId: saved.trainingDayId,
      setNumber: saved.setNumber,
      weightKg: saved.weightKg,
      reps: saved.reps,
      rir: saved.rir,
      estimated1rm: saved.estimated1rm,
      volumeLoad: saved.volumeLoad,
      isWarmup: saved.isWarmup,
      performedAt: saved.performedAt,
    };
    this.events.emit(PROGRESS_LOGGED, event);

    // Инвалидация: новый подход → дашборд + рекорды устарели
    await this.cache.delMany([
      cacheKeys.dashboard(userId),
      cacheKeys.records(userId),
      cacheKeys.weeklyReport(userId),
    ]);

    this.metrics.progressLogs.inc({ type: 'set' });
    return ProgressLogResponseDto.fromEntity(saved);
  }

  // ============= logSessionRPE =============

  async logSessionRPE(userId: string, dto: LogSessionRPEDto): Promise<SessionRPEResponseDto> {
    await this.assertOwnsDay(dto.trainingDayId, userId);

    const internalLoad = this.engine.calculateInternalLoad(
      dto.sessionRpe,
      dto.durationMinutes,
    );

    const log = this.sessionRpeRepo.create({
      userId,
      trainingDayId: dto.trainingDayId,
      sessionRpe: dto.sessionRpe,
      durationMinutes: dto.durationMinutes,
      internalLoad,
      recordedAt: new Date(),
    });
    const saved = await this.sessionRpeRepo.save(log);

    const event: SessionRPELoggedEvent = {
      userId: saved.userId,
      trainingDayId: saved.trainingDayId,
      sessionRpe: saved.sessionRpe,
      durationMinutes: saved.durationMinutes,
      internalLoad: saved.internalLoad,
      recordedAt: saved.recordedAt,
    };
    this.events.emit(SESSION_RPE_LOGGED, event);

    this.metrics.progressLogs.inc({ type: 'session_rpe' });
    return SessionRPEResponseDto.fromEntity(saved);
  }

  // ============= queries =============

  async getByDateRange(
    userId: string,
    query: ProgressLogsQueryDto,
  ): Promise<PaginatedResponse<ProgressLogResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const where: FindOptionsWhere<ProgressLog> = { userId };
    if (query.exerciseId) where.exerciseId = query.exerciseId;
    if (query.from && query.to) {
      where.performedAt = Between(query.from, query.to);
    }

    const [items, total] = await this.logRepo.findAndCount({
      where,
      order: { performedAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data: items.map(ProgressLogResponseDto.fromEntity),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getByExercise(userId: string, exerciseId: string): Promise<ProgressLogResponseDto[]> {
    const logs = await this.logRepo.find({
      where: { userId, exerciseId, isWarmup: false },
      order: { performedAt: 'ASC' },
    });
    return logs.map(ProgressLogResponseDto.fromEntity);
  }

  /**
   * PR по каждому упражнению: max(weight) и max(estimated_1rm) среди non-warmup.
   * Реализовано через QueryBuilder с GROUP BY exercise_id.
   */
  async getPersonalRecords(userId: string): Promise<PersonalRecordDto[]> {
    return this.cache.getOrCompute(
      cacheKeys.records(userId),
      CACHE_TTL.RECORDS_SECONDS,
      async () => {
        const rows: Array<{
          exercise_id: string;
          pr_weight: string;
          pr_e1rm: string;
          achieved_at: Date;
        }> = await this.logRepo
          .createQueryBuilder('pl')
          .select('pl.exercise_id', 'exercise_id')
          .addSelect('MAX(pl.weight_kg)', 'pr_weight')
          .addSelect('MAX(pl.estimated_1rm)', 'pr_e1rm')
          .addSelect('MAX(pl.performed_at)', 'achieved_at')
          .where('pl.user_id = :userId', { userId })
          .andWhere('pl.is_warmup = false')
          .groupBy('pl.exercise_id')
          .getRawMany();

        return rows.map((r) => ({
          exerciseId: r.exercise_id,
          prWeightKg: parseFloat(r.pr_weight),
          prE1rmKg: parseFloat(r.pr_e1rm),
          achievedAt: r.achieved_at,
        }));
      },
    );
  }

  async getVolumeLoadByWeek(userId: string): Promise<WeeklyAggregateDto[]> {
    const rows: Array<{ week: Date; volume: string }> = await this.logRepo
      .createQueryBuilder('pl')
      .select(`DATE_TRUNC('week', pl.performed_at)`, 'week')
      .addSelect('SUM(pl.volume_load)', 'volume')
      .where('pl.user_id = :userId', { userId })
      .andWhere('pl.is_warmup = false')
      .andWhere('pl.volume_load IS NOT NULL')
      .groupBy('week')
      .orderBy('week', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      weekStart: r.week,
      value: parseFloat(r.volume),
    }));
  }

  async getInternalLoadByWeek(userId: string): Promise<WeeklyAggregateDto[]> {
    const rows: Array<{ week: Date; load: string }> = await this.sessionRpeRepo
      .createQueryBuilder('s')
      .select(`DATE_TRUNC('week', s.recorded_at)`, 'week')
      .addSelect('SUM(s.internal_load)', 'load')
      .where('s.user_id = :userId', { userId })
      .groupBy('week')
      .orderBy('week', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      weekStart: r.week,
      value: parseFloat(r.load),
    }));
  }

  /**
   * Средний RIR по списку main_lift exerciseIds для конкретной недели.
   * Если mainLiftIds пуст — берёт все упражнения.
   */
  async getAvgRIRMainLifts(
    userId: string,
    weekStart: Date,
    mainLiftIds: string[] = [],
  ): Promise<number | null> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const qb = this.logRepo
      .createQueryBuilder('pl')
      .select('AVG(pl.rir)', 'avg_rir')
      .where('pl.user_id = :userId', { userId })
      .andWhere('pl.is_warmup = false')
      .andWhere('pl.rir IS NOT NULL')
      .andWhere('pl.performed_at >= :weekStart AND pl.performed_at < :weekEnd', {
        weekStart,
        weekEnd,
      });
    if (mainLiftIds.length > 0) {
      qb.andWhere('pl.exercise_id IN (:...mainLiftIds)', { mainLiftIds });
    }

    const row = await qb.getRawOne<{ avg_rir: string | null }>();
    if (!row?.avg_rir) return null;
    return parseFloat(row.avg_rir);
  }

  // ============= private =============

  private async assertOwnsDay(trainingDayId: string, userId: string): Promise<void> {
    const day = await this.trainingDayRepo.findOne({
      where: { id: trainingDayId },
      relations: { week: { program: true } },
    });
    if (!day) throw new NotFoundException('Тренировочный день не найден');
    if (day.week.program.userId !== userId) {
      throw new ForbiddenException('Доступ к чужой тренировке запрещён');
    }
  }
}
