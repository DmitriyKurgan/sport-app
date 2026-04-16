import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Job } from 'bull';
import { AlertsService } from '../../alerts/alerts.service';
import { AnalyticsService } from '../../analytics/analytics.service';
import { AvatarService } from '../../avatar/avatar.service';
import { BodyTypeService } from '../../body-type/body-type.service';
import { NutritionService } from '../../nutrition/nutrition.service';
import { BodyMeasurementService } from '../../progress/services/body-measurement.service';
import { User } from '../../user/user.entity';
import { AlertsProcessor } from '../processors/alerts.processor';
import { AuthProcessor } from '../processors/auth.processor';
import { BodyScoringProcessor } from '../processors/body-scoring.processor';
import { NutritionProcessor } from '../processors/nutrition.processor';
import { ReportsProcessor } from '../processors/reports.processor';

const mkJob = <T>(data: T) => ({ data }) as Job<T>;

describe('AlertsProcessor', () => {
  let processor: AlertsProcessor;
  let alertsService: jest.Mocked<AlertsService>;
  let userRepo: any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AlertsProcessor,
        {
          provide: AlertsService,
          useValue: { runAllDetectors: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();
    processor = module.get(AlertsProcessor);
    alertsService = module.get(AlertsService);
    userRepo = module.get(getRepositoryToken(User));
  });

  it('runForUser вызывает runAllDetectors с userId', async () => {
    await processor.runForUser(mkJob({ userId: 'u1' }));
    expect(alertsService.runAllDetectors).toHaveBeenCalledWith('u1');
  });

  it('runForAllUsers загружает активных и проходит по каждому', async () => {
    userRepo.find.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }]);
    await processor.runForAllUsers();
    expect(alertsService.runAllDetectors).toHaveBeenCalledTimes(3);
  });

  it('runForAllUsers не падает при ошибке у одного пользователя', async () => {
    userRepo.find.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);
    alertsService.runAllDetectors
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('user 2 broken'));

    await expect(processor.runForAllUsers()).resolves.not.toThrow();
    expect(alertsService.runAllDetectors).toHaveBeenCalledTimes(2);
  });
});

describe('BodyScoringProcessor', () => {
  let processor: BodyScoringProcessor;
  let bodyTypeService: jest.Mocked<BodyTypeService>;
  let avatarService: jest.Mocked<AvatarService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BodyScoringProcessor,
        {
          provide: BodyTypeService,
          useValue: { recalculate: jest.fn().mockResolvedValue({}) },
        },
        {
          provide: AvatarService,
          useValue: { recalculate: jest.fn().mockResolvedValue({}) },
        },
      ],
    }).compile();
    processor = module.get(BodyScoringProcessor);
    bodyTypeService = module.get(BodyTypeService);
    avatarService = module.get(AvatarService);
  });

  it('пересчитывает body-type, потом avatar', async () => {
    await processor.recalculate(mkJob({ userId: 'u1' }));
    expect(bodyTypeService.recalculate).toHaveBeenCalledWith('u1');
    expect(avatarService.recalculate).toHaveBeenCalledWith('u1');
  });
});

describe('NutritionProcessor', () => {
  let processor: NutritionProcessor;
  let nutritionService: jest.Mocked<NutritionService>;
  let bodyMeasurementService: jest.Mocked<BodyMeasurementService>;
  let userRepo: any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NutritionProcessor,
        {
          provide: NutritionService,
          useValue: { recalibrate: jest.fn().mockResolvedValue({}) },
        },
        {
          provide: BodyMeasurementService,
          useValue: { getWeightTrend: jest.fn() },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();
    processor = module.get(NutritionProcessor);
    nutritionService = module.get(NutritionService);
    bodyMeasurementService = module.get(BodyMeasurementService);
    userRepo = module.get(getRepositoryToken(User));
  });

  it('пропускает пользователей с малой историей weight trend', async () => {
    userRepo.find.mockResolvedValue([{ id: 'u1' }]);
    bodyMeasurementService.getWeightTrend.mockResolvedValue([
      { date: new Date('2026-04-01'), weightKg: 80, avg7d: null, avg14d: null },
    ]); // < 7 точек

    await processor.recalibrateAll();
    expect(nutritionService.recalibrate).not.toHaveBeenCalled();
  });

  it('вызывает recalibrate с дельтой при достаточной истории', async () => {
    userRepo.find.mockResolvedValue([{ id: 'u1' }]);
    const trend = Array.from({ length: 14 }, (_, i) => ({
      date: new Date(`2026-04-${String(i + 1).padStart(2, '0')}`),
      weightKg: 80 - i * 0.05,
      avg7d: 80 - i * 0.05,
      avg14d: 80 - i * 0.05,
    }));
    bodyMeasurementService.getWeightTrend.mockResolvedValue(trend);

    await processor.recalibrateAll();
    expect(nutritionService.recalibrate).toHaveBeenCalledWith('u1', expect.any(Number));
  });
});

describe('ReportsProcessor', () => {
  let processor: ReportsProcessor;
  let analyticsService: jest.Mocked<AnalyticsService>;
  let userRepo: any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReportsProcessor,
        {
          provide: AnalyticsService,
          useValue: { getWeeklyReport: jest.fn().mockResolvedValue({}) },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();
    processor = module.get(ReportsProcessor);
    analyticsService = module.get(AnalyticsService);
    userRepo = module.get(getRepositoryToken(User));
  });

  it('генерирует отчёт для каждого активного пользователя', async () => {
    userRepo.find.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);
    await processor.generateForAll();
    expect(analyticsService.getWeeklyReport).toHaveBeenCalledTimes(2);
  });

  it('не падает если у одного нет данных', async () => {
    userRepo.find.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);
    analyticsService.getWeeklyReport
      .mockResolvedValueOnce({} as any)
      .mockRejectedValueOnce(new Error('no data'));
    await expect(processor.generateForAll()).resolves.not.toThrow();
  });
});

describe('AuthProcessor', () => {
  let processor: AuthProcessor;
  let userRepo: any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthProcessor,
        {
          provide: getRepositoryToken(User),
          useValue: { update: jest.fn() },
        },
      ],
    }).compile();
    processor = module.get(AuthProcessor);
    userRepo = module.get(getRepositoryToken(User));
  });

  it('обнуляет refresh-token-hash для просроченных', async () => {
    userRepo.update.mockResolvedValue({ affected: 5 });
    await processor.cleanup();
    expect(userRepo.update).toHaveBeenCalled();
    const callArgs = userRepo.update.mock.calls[0];
    expect(callArgs[1]).toEqual({ refreshTokenHash: null });
  });
});
