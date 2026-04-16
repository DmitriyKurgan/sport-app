import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NutritionService } from '../../nutrition/nutrition.service';
import { ProfileService } from '../../profile/profile.service';
import { BodyMeasurementService } from '../../progress/services/body-measurement.service';
import { ProgressLogService } from '../../progress/services/progress-log.service';
import { Exercise, TrainingProgram } from '../../training/entities';
import { Alert } from '../alert.entity';
import { AlertsService } from '../alerts.service';

describe('AlertsService', () => {
  let service: AlertsService;
  let repo: any;
  let programRepo: any;
  let exerciseRepo: any;
  let profileService: jest.Mocked<ProfileService>;
  let progressLogService: jest.Mocked<ProgressLogService>;
  let bodyMeasurementService: jest.Mocked<BodyMeasurementService>;
  let nutritionService: jest.Mocked<NutritionService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AlertsService,
        {
          provide: getRepositoryToken(Alert),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn((x) => x),
            save: jest.fn((x) => Promise.resolve({ ...x, id: 'alert-1', triggeredAt: new Date() })),
          },
        },
        {
          provide: getRepositoryToken(TrainingProgram),
          useValue: { findOne: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(Exercise),
          useValue: { findByIds: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: ProfileService,
          useValue: { findByUserId: jest.fn() },
        },
        {
          provide: ProgressLogService,
          useValue: {
            getByExercise: jest.fn().mockResolvedValue([]),
            getPersonalRecords: jest.fn().mockResolvedValue([]),
            getInternalLoadByWeek: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: BodyMeasurementService,
          useValue: { getWeightTrend: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: NutritionService,
          useValue: { recalibrate: jest.fn().mockResolvedValue({ caloriesTarget: 2100 }) },
        },
      ],
    }).compile();

    service = module.get(AlertsService);
    repo = module.get(getRepositoryToken(Alert));
    programRepo = module.get(getRepositoryToken(TrainingProgram));
    exerciseRepo = module.get(getRepositoryToken(Exercise));
    profileService = module.get(ProfileService);
    progressLogService = module.get(ProgressLogService);
    bodyMeasurementService = module.get(BodyMeasurementService);
    nutritionService = module.get(NutritionService);
  });

  describe('aggregateWeeklyMaxE1RM (static)', () => {
    it('берёт max e1RM на каждой неделе', () => {
      const logs = [
        { performedAt: new Date('2026-04-06'), estimated1rm: 100, isWarmup: false },
        { performedAt: new Date('2026-04-08'), estimated1rm: 105, isWarmup: false },
        { performedAt: new Date('2026-04-13'), estimated1rm: 110, isWarmup: false },
      ];
      const result = AlertsService.aggregateWeeklyMaxE1RM(logs);
      expect(result).toEqual([105, 110]);
    });

    it('игнорирует warmup и null', () => {
      const logs = [
        { performedAt: new Date('2026-04-06'), estimated1rm: 100, isWarmup: false },
        { performedAt: new Date('2026-04-07'), estimated1rm: 200, isWarmup: true },
        { performedAt: new Date('2026-04-08'), estimated1rm: null, isWarmup: false },
      ];
      const result = AlertsService.aggregateWeeklyMaxE1RM(logs);
      expect(result).toEqual([100]);
    });

    it('пустой массив → []', () => {
      expect(AlertsService.aggregateWeeklyMaxE1RM([])).toEqual([]);
    });
  });

  describe('getActive', () => {
    it('возвращает только не-dismissed', async () => {
      repo.find.mockResolvedValue([
        { id: 'a1', userId: 'u1', type: 'plateau_strength', severity: 'warning',
          title: 'X', message: 'm', recommendation: 'r',
          context: null, triggeredAt: new Date(), dismissedAt: null,
          actedUpon: false, actedAt: null },
      ]);
      const result = await service.getActive('u1');
      expect(result).toHaveLength(1);
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'u1' }) }),
      );
    });
  });

  describe('dismiss', () => {
    it('проставляет dismissedAt', async () => {
      repo.findOne.mockResolvedValue({
        id: 'a1', userId: 'u1', type: 'plateau_strength', severity: 'warning',
        title: '', message: '', recommendation: '',
        context: null, triggeredAt: new Date(), dismissedAt: null,
        actedUpon: false, actedAt: null,
      });
      const result = await service.dismiss('a1', 'u1');
      expect(result.dismissedAt).not.toBeNull();
    });

    it('Forbidden если чужой alert', async () => {
      repo.findOne.mockResolvedValue({ id: 'a1', userId: 'other' });
      await expect(service.dismiss('a1', 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('NotFound если alert не существует', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.dismiss('a1', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('actOn', () => {
    it('weight_plateau_cut → recalibrate', async () => {
      repo.findOne.mockResolvedValue({
        id: 'a1', userId: 'u1', type: 'weight_plateau_cut', severity: 'info',
        title: '', message: '', recommendation: '', context: null,
        triggeredAt: new Date(), dismissedAt: null, actedUpon: false, actedAt: null,
      });
      const result = await service.actOn('a1', 'u1');
      expect(nutritionService.recalibrate).toHaveBeenCalledWith('u1', 0);
      expect(result.performedAction).toMatch(/Калории/);
      expect(result.alert.actedUpon).toBe(true);
      expect(result.alert.dismissedAt).not.toBeNull(); // act = автоматически dismissed
    });

    it('plateau_strength → принудительный делoad', async () => {
      repo.findOne.mockResolvedValue({
        id: 'a1', userId: 'u1', type: 'plateau_strength', severity: 'warning',
        title: '', message: '', recommendation: '', context: null,
        triggeredAt: new Date(), dismissedAt: null, actedUpon: false, actedAt: null,
      });
      programRepo.findOne.mockResolvedValue({
        id: 'p1',
        userId: 'u1',
        configSnapshot: {},
      });

      const result = await service.actOn('a1', 'u1');
      expect(programRepo.save).toHaveBeenCalled();
      expect(result.performedAction).toMatch(/делoad/);
    });
  });

  describe('runAllDetectors', () => {
    it('пропускает дубликаты (existing active alert того же типа)', async () => {
      profileService.findByUserId.mockResolvedValue({
        bodyweightGoal: 'cut',
        sleepHoursAvg: 5,
      } as any);

      // Симулируем плато по cut: 14 дней одинакового веса
      bodyMeasurementService.getWeightTrend.mockResolvedValue(
        Array.from({ length: 14 }, (_, i) => ({
          date: new Date(Date.now() - (13 - i) * 86400000),
          weightKg: 80,
          avg7d: 80,
          avg14d: 80,
        })),
      );

      // Уже есть active weight_plateau_cut → дедупликация
      repo.findOne.mockResolvedValue({ id: 'existing', type: 'weight_plateau_cut' });

      const result = await service.runAllDetectors('u1');
      // weight_plateau_cut уже есть → не создан повторно
      expect(result.find((a) => a.type === 'weight_plateau_cut')).toBeUndefined();
    });

    it('возвращает пустой массив если профиля нет', async () => {
      profileService.findByUserId.mockRejectedValue(new NotFoundException());
      const result = await service.runAllDetectors('u1');
      expect(result).toEqual([]);
    });

    it('создаёт alert если detector сработал и нет дубликата', async () => {
      profileService.findByUserId.mockResolvedValue({
        bodyweightGoal: 'cut',
        sleepHoursAvg: 7,
      } as any);

      bodyMeasurementService.getWeightTrend.mockResolvedValue(
        Array.from({ length: 14 }, (_, i) => ({
          date: new Date(Date.now() - (13 - i) * 86400000),
          weightKg: 80,
          avg7d: 80,
          avg14d: 80,
        })),
      );

      // Нет существующих alert'ов
      repo.findOne.mockResolvedValue(null);

      const result = await service.runAllDetectors('u1');
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.find((a) => a.type === 'weight_plateau_cut')).toBeDefined();
    });
  });
});
