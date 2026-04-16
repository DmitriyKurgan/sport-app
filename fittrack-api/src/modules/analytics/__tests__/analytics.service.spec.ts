import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { cacheServiceProvider } from '../../cache/__tests__/cache-mock';
import { ProfileService } from '../../profile/profile.service';
import { BodyMeasurementService } from '../../progress/services/body-measurement.service';
import { ProgressLogService } from '../../progress/services/progress-log.service';
import { TrainingEngineService } from '../../training-engine';
import { Exercise, TrainingDay, TrainingProgram } from '../../training/entities';
import { AnalyticsService } from '../analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let programRepo: any;
  let dayRepo: any;
  let exerciseRepo: any;
  let progressLogService: jest.Mocked<ProgressLogService>;
  let bodyMeasurementService: jest.Mocked<BodyMeasurementService>;
  let profileService: jest.Mocked<ProfileService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        cacheServiceProvider,
        {
          provide: getRepositoryToken(TrainingProgram),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(TrainingDay),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(Exercise),
          useValue: { findBy: jest.fn() },
        },
        {
          provide: ProfileService,
          useValue: { findByUserId: jest.fn() },
        },
        {
          provide: ProgressLogService,
          useValue: {
            getByExercise: jest.fn(),
            getPersonalRecords: jest.fn().mockResolvedValue([]),
            getVolumeLoadByWeek: jest.fn().mockResolvedValue([]),
            getInternalLoadByWeek: jest.fn().mockResolvedValue([]),
            getAvgRIRMainLifts: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: BodyMeasurementService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            getWeightTrend: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: TrainingEngineService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get(AnalyticsService);
    programRepo = module.get(getRepositoryToken(TrainingProgram));
    dayRepo = module.get(getRepositoryToken(TrainingDay));
    exerciseRepo = module.get(getRepositoryToken(Exercise));
    progressLogService = module.get(ProgressLogService);
    bodyMeasurementService = module.get(BodyMeasurementService);
    profileService = module.get(ProfileService);
  });

  describe('findCurrentWeek (static)', () => {
    it('возвращает первую неделю с незавершёнными днями', () => {
      const program = {
        weeks: [
          {
            weekNumber: 1,
            days: [{ completedAt: new Date() }, { completedAt: new Date() }],
          },
          {
            weekNumber: 2,
            days: [{ completedAt: null }, { completedAt: null }],
          },
        ],
      } as any;
      const { week, weekNumber } = AnalyticsService.findCurrentWeek(program);
      expect(weekNumber).toBe(2);
      expect(week).toBe(program.weeks[1]);
    });

    it('возвращает последнюю неделю если все завершены', () => {
      const program = {
        weeks: [
          { weekNumber: 1, days: [{ completedAt: new Date() }] },
          { weekNumber: 2, days: [{ completedAt: new Date() }] },
        ],
      } as any;
      const { weekNumber } = AnalyticsService.findCurrentWeek(program);
      expect(weekNumber).toBe(2);
    });

    it('пустая программа → week=null', () => {
      const program = { weeks: [] } as any;
      const { week } = AnalyticsService.findCurrentWeek(program);
      expect(week).toBeNull();
    });
  });

  describe('collectMainLiftIds (static)', () => {
    it('возвращает уникальные ID main_lift exerciseId', () => {
      const week = {
        days: [
          {
            exercises: [
              { exerciseId: 'a', role: 'main_lift' },
              { exerciseId: 'b', role: 'accessory' },
            ],
          },
          {
            exercises: [
              { exerciseId: 'a', role: 'main_lift' }, // дубль
              { exerciseId: 'c', role: 'main_lift' },
            ],
          },
        ],
      } as any;
      const ids = AnalyticsService.collectMainLiftIds(week);
      expect(ids.sort()).toEqual(['a', 'c']);
    });
  });

  describe('calculateWeightDelta (static)', () => {
    it('первый и последний avg7d', () => {
      const trend = [
        { date: new Date(), weightKg: 80, avg7d: 80.5 },
        { date: new Date(), weightKg: 79, avg7d: 79.0 },
      ];
      expect(AnalyticsService.calculateWeightDelta(trend)).toBe(-1.5);
    });

    it('меньше 2 точек → 0', () => {
      expect(AnalyticsService.calculateWeightDelta([])).toBe(0);
      expect(
        AnalyticsService.calculateWeightDelta([{ date: new Date(), weightKg: 80, avg7d: 80 }]),
      ).toBe(0);
    });

    it('fallback на raw weight если avg7d=null', () => {
      const trend = [
        { date: new Date(), weightKg: 80, avg7d: null },
        { date: new Date(), weightKg: 81, avg7d: null },
      ];
      expect(AnalyticsService.calculateWeightDelta(trend)).toBe(1);
    });
  });

  describe('getDashboard', () => {
    it('возвращает пустой dashboard если нет активной программы', async () => {
      programRepo.findOne.mockResolvedValue(null);

      const result = await service.getDashboard('user-1');
      expect(result.currentProgram).toBeNull();
      expect(result.weekProgress.planned).toBe(0);
      expect(result.consistencyScore).toBe(0);
    });

    it('собирает программу с консистенси', async () => {
      programRepo.findOne.mockResolvedValue({
        id: 'p1',
        name: 'Test',
        totalWeeks: 12,
        weeks: [
          {
            weekNumber: 1,
            phase: 'adaptation',
            days: [
              { id: 'd1', name: 'Upper', dayNumber: 1, completedAt: new Date(), startedAt: new Date(), exercises: [] },
              { id: 'd2', name: 'Lower', dayNumber: 2, completedAt: null, startedAt: null, exercises: [] },
            ],
          },
        ],
      });

      const result = await service.getDashboard('user-1');
      expect(result.currentProgram?.weekNumber).toBe(1);
      expect(result.currentProgram?.completedDays).toBe(1);
      expect(result.weekProgress.planned).toBe(2);
      expect(result.weekProgress.upcoming).toHaveLength(1);
      expect(result.consistencyScore).toBe(50);
    });
  });

  describe('getExerciseProgress', () => {
    it('фильтрует warmup и null e1rm', async () => {
      progressLogService.getByExercise.mockResolvedValue([
        { performedAt: new Date(), weightKg: 80, reps: 10, estimated1rm: 106.7, isWarmup: false } as any,
        { performedAt: new Date(), weightKg: 50, reps: 10, estimated1rm: null, isWarmup: true } as any,
        { performedAt: new Date(), weightKg: 85, reps: 8, estimated1rm: 107.7, isWarmup: false } as any,
      ]);

      const result = await service.getExerciseProgress('user-1', 'ex-1');
      expect(result).toHaveLength(2);
      expect(result[0].e1rm).toBe(106.7);
    });
  });

  describe('getWeeklyReport', () => {
    it('возвращает report с 3 insights', async () => {
      profileService.findByUserId.mockResolvedValue({
        sleepHoursAvg: 7,
        bodyweightGoal: 'maintain',
      } as any);
      dayRepo.find.mockResolvedValue([]);
      programRepo.findOne.mockResolvedValue(null);
      progressLogService.getVolumeLoadByWeek.mockResolvedValue([]);
      progressLogService.getInternalLoadByWeek.mockResolvedValue([]);
      progressLogService.getAvgRIRMainLifts.mockResolvedValue(2.5);
      progressLogService.getPersonalRecords.mockResolvedValue([]);
      bodyMeasurementService.getWeightTrend.mockResolvedValue([]);

      const result = await service.getWeeklyReport('user-1');
      expect(result.insights).toHaveLength(3);
      expect(result.metrics.completedSessions).toBe(0);
    });
  });
});
