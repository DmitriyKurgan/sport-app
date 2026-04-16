import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { cacheServiceProvider } from '../../cache/__tests__/cache-mock';
import { metricsServiceProvider } from '../../metrics/__tests__/metrics-mock';
import { TrainingDay } from '../../training/entities';
import { TrainingEngineService } from '../../training-engine';
import { ProgressLog, SessionRPELog } from '../entities';
import {
  PROGRESS_LOGGED,
  SESSION_RPE_LOGGED,
} from '../events';
import { ProgressLogService } from '../services/progress-log.service';

describe('ProgressLogService', () => {
  let service: ProgressLogService;
  let logRepo: any;
  let sessionRpeRepo: any;
  let dayRepo: any;
  let engine: jest.Mocked<TrainingEngineService>;
  let events: jest.Mocked<EventEmitter2>;

  const mkDay = (userId = 'user-1') => ({
    id: 'day-1',
    week: { program: { userId } },
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProgressLogService,
        cacheServiceProvider,
        metricsServiceProvider,
        {
          provide: getRepositoryToken(ProgressLog),
          useValue: {
            create: jest.fn((x) => x),
            save: jest.fn((x) => Promise.resolve({ ...x, id: 'log-1', performedAt: new Date() })),
            find: jest.fn(),
            findAndCount: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SessionRPELog),
          useValue: {
            create: jest.fn((x) => x),
            save: jest.fn((x) => Promise.resolve({ ...x, id: 'srpe-1', recordedAt: new Date() })),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TrainingDay),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: TrainingEngineService,
          useValue: {
            calculateE1RM: jest.fn((w, r) => w * (1 + r / 30)),
            calculateInternalLoad: jest.fn((rpe, dur) => rpe * dur),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ProgressLogService);
    logRepo = module.get(getRepositoryToken(ProgressLog));
    sessionRpeRepo = module.get(getRepositoryToken(SessionRPELog));
    dayRepo = module.get(getRepositoryToken(TrainingDay));
    engine = module.get(TrainingEngineService);
    events = module.get(EventEmitter2);
  });

  describe('logSet', () => {
    it('сохраняет лог с расчётом e1RM и volumeLoad, эмитит событие', async () => {
      dayRepo.findOne.mockResolvedValue(mkDay());

      const result = await service.logSet('user-1', {
        exerciseId: 'ex-1',
        trainingDayId: 'day-1',
        setNumber: 1,
        weightKg: 80,
        reps: 10,
        rir: 2,
      });

      expect(engine.calculateE1RM).toHaveBeenCalledWith(80, 10);
      expect(result.estimated1rm).toBeCloseTo(80 * (1 + 10 / 30), 1);
      expect(result.volumeLoad).toBe(800);
      expect(events.emit).toHaveBeenCalledWith(PROGRESS_LOGGED, expect.any(Object));
    });

    it('warmup: e1RM и volumeLoad = null', async () => {
      dayRepo.findOne.mockResolvedValue(mkDay());
      const result = await service.logSet('user-1', {
        exerciseId: 'ex-1',
        trainingDayId: 'day-1',
        setNumber: 1,
        weightKg: 50,
        reps: 10,
        isWarmup: true,
      });
      expect(result.estimated1rm).toBeNull();
      expect(result.volumeLoad).toBeNull();
    });

    it('Forbidden если день чужой', async () => {
      dayRepo.findOne.mockResolvedValue(mkDay('other-user'));
      await expect(
        service.logSet('user-1', {
          exerciseId: 'ex-1',
          trainingDayId: 'day-1',
          setNumber: 1,
          weightKg: 80,
          reps: 10,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('NotFound если день не существует', async () => {
      dayRepo.findOne.mockResolvedValue(null);
      await expect(
        service.logSet('user-1', {
          exerciseId: 'ex-1',
          trainingDayId: 'day-1',
          setNumber: 1,
          weightKg: 80,
          reps: 10,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('без trainingDayId — IDOR-проверка пропускается', async () => {
      const result = await service.logSet('user-1', {
        exerciseId: 'ex-1',
        setNumber: 1,
        weightKg: 80,
        reps: 10,
      });
      expect(dayRepo.findOne).not.toHaveBeenCalled();
      expect(result.id).toBe('log-1');
    });
  });

  describe('logSessionRPE', () => {
    it('сохраняет с расчётом internal_load + emit', async () => {
      dayRepo.findOne.mockResolvedValue(mkDay());
      const result = await service.logSessionRPE('user-1', {
        trainingDayId: 'day-1',
        sessionRpe: 7,
        durationMinutes: 60,
      });
      expect(engine.calculateInternalLoad).toHaveBeenCalledWith(7, 60);
      expect(result.internalLoad).toBe(420);
      expect(events.emit).toHaveBeenCalledWith(SESSION_RPE_LOGGED, expect.any(Object));
    });

    it('Forbidden для чужого дня', async () => {
      dayRepo.findOne.mockResolvedValue(mkDay('other-user'));
      await expect(
        service.logSessionRPE('user-1', {
          trainingDayId: 'day-1',
          sessionRpe: 7,
          durationMinutes: 60,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getByDateRange', () => {
    it('возвращает paginated с meta', async () => {
      logRepo.findAndCount.mockResolvedValue([
        [{ id: 'l1', exerciseId: 'e1', setNumber: 1, weightKg: 80, reps: 10, performedAt: new Date() }],
        25,
      ]);
      const result = await service.getByDateRange('user-1', { page: 2, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      });
    });
  });

  describe('getPersonalRecords', () => {
    it('возвращает PR через QueryBuilder', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { exercise_id: 'e1', pr_weight: '100', pr_e1rm: '120.5', achieved_at: new Date('2026-04-10') },
        ]),
      };
      logRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getPersonalRecords('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].prWeightKg).toBe(100);
      expect(result[0].prE1rmKg).toBe(120.5);
    });
  });

  describe('getVolumeLoadByWeek', () => {
    it('агрегирует SUM(volume_load) GROUP BY week', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { week: new Date('2026-04-07'), volume: '15200' },
          { week: new Date('2026-04-14'), volume: '17800' },
        ]),
      };
      logRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getVolumeLoadByWeek('user-1');
      expect(result).toEqual([
        { weekStart: new Date('2026-04-07'), value: 15200 },
        { weekStart: new Date('2026-04-14'), value: 17800 },
      ]);
    });
  });

  describe('getAvgRIRMainLifts', () => {
    it('возвращает среднее RIR', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg_rir: '2.3' }),
      };
      logRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getAvgRIRMainLifts('user-1', new Date('2026-04-07'), [
        'ex-1',
      ]);
      expect(result).toBe(2.3);
    });

    it('null если нет данных', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg_rir: null }),
      };
      logRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getAvgRIRMainLifts('user-1', new Date());
      expect(result).toBeNull();
    });
  });
});
