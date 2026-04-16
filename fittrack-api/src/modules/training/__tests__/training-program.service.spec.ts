import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { cacheServiceProvider } from '../../cache/__tests__/cache-mock';
import { metricsServiceProvider } from '../../metrics/__tests__/metrics-mock';
import { ProfileService } from '../../profile/profile.service';
import { TrainingEngineService } from '../../training-engine';
import {
  BodyweightGoal,
  DailyActivityLevel,
  EquipmentAccess,
  ExperienceLevel,
  Gender,
  NutritionTier,
  PrimaryTrainingGoal,
  StressLevel,
} from '../../profile/enums';
import { TrainingProgram } from '../entities';
import { ExerciseService } from '../services/exercise.service';
import { TrainingProgramService } from '../services/training-program.service';

describe('TrainingProgramService', () => {
  let service: TrainingProgramService;
  let programRepo: any;
  let dataSource: any;
  let engine: jest.Mocked<TrainingEngineService>;
  let profileService: jest.Mocked<ProfileService>;
  let exerciseService: jest.Mocked<ExerciseService>;

  const mockProfile = {
    sex: Gender.MALE,
    ageYears: 28,
    heightCm: 180,
    weightKg: 80,
    experienceLevel: ExperienceLevel.INTERMEDIATE,
    currentTrainingDaysPerWeek: 3,
    primaryTrainingGoal: PrimaryTrainingGoal.HYPERTROPHY,
    bodyweightGoal: BodyweightGoal.MAINTAIN,
    weeklyTrainingDaysTarget: 4,
    sessionDurationMinutes: 60,
    equipmentAccess: EquipmentAccess.GYM,
    injuryPainFlags: [],
    preScreeningRedFlags: false,
    sleepHoursAvg: 7.5,
    stressLevel: StressLevel.LOW,
    dailyActivityLevel: DailyActivityLevel.MODERATE,
    nutritionTierPreference: NutritionTier.STANDARD,
  };

  beforeEach(async () => {
    const mockEntityManager = {
      getRepository: jest.fn(() => ({
        update: jest.fn(),
        save: jest.fn().mockImplementation((p) => Promise.resolve({ ...p, id: 'prog-1' })),
        findOneOrFail: jest.fn().mockResolvedValue({
          id: 'prog-1',
          userId: 'user-1',
          name: 'Test',
          status: 'active',
          totalWeeks: 12,
          primaryGoal: 'hypertrophy',
          experienceLevel: 'intermediate',
          splitType: 'upper_lower',
          weeklyDays: 4,
          isLowIntensityMode: false,
          weeks: [],
          startedAt: new Date(),
          completedAt: null,
          description: null,
          createdAt: new Date(),
        }),
      })),
    };

    const module = await Test.createTestingModule({
      providers: [
        TrainingProgramService,
        cacheServiceProvider,
        metricsServiceProvider,
        {
          provide: getRepositoryToken(TrainingProgram),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((cb) => cb(mockEntityManager)),
          },
        },
        {
          provide: TrainingEngineService,
          useValue: {
            generateProgram: jest.fn(),
          },
        },
        {
          provide: ProfileService,
          useValue: {
            findByUserId: jest.fn(),
          },
        },
        {
          provide: ExerciseService,
          useValue: {
            loadCatalogForEngine: jest.fn(),
            loadAllActive: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TrainingProgramService);
    programRepo = module.get(getRepositoryToken(TrainingProgram));
    dataSource = module.get(DataSource);
    engine = module.get(TrainingEngineService);
    profileService = module.get(ProfileService);
    exerciseService = module.get(ExerciseService);
  });

  describe('toProfileConfig (static)', () => {
    it('правильно конвертирует Profile DTO в ProfileConfig', () => {
      const config = TrainingProgramService.toProfileConfig(mockProfile);
      expect(config.sex).toBe(Gender.MALE);
      expect(config.weeklyTrainingDaysTarget).toBe(4);
      expect(config.preScreeningRedFlags).toBe(false);
    });
  });

  describe('generate', () => {
    it('деактивирует старую программу и создаёт новую в транзакции', async () => {
      profileService.findByUserId.mockResolvedValueOnce(mockProfile as any);
      exerciseService.loadCatalogForEngine.mockResolvedValueOnce([{ id: 'e1', slug: 'pushup' } as any]);
      exerciseService.loadAllActive.mockResolvedValueOnce([{ id: 'e1', slug: 'pushup' } as any]);
      engine.generateProgram.mockReturnValue({
        name: 'Test Program',
        totalWeeks: 12,
        primaryGoal: PrimaryTrainingGoal.HYPERTROPHY,
        experienceLevel: ExperienceLevel.INTERMEDIATE,
        splitType: 'upper_lower' as any,
        weeklyDays: 4,
        isLowIntensityMode: false,
        weeks: [],
      });

      const result = await service.generate('user-1');

      expect(profileService.findByUserId).toHaveBeenCalledWith('user-1');
      expect(engine.generateProgram).toHaveBeenCalled();
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result.id).toBe('prog-1');
    });

    it('BadRequest если каталог пуст', async () => {
      profileService.findByUserId.mockResolvedValueOnce(mockProfile as any);
      exerciseService.loadCatalogForEngine.mockResolvedValueOnce([]);
      await expect(service.generate('user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findActive', () => {
    it('возвращает активную программу', async () => {
      programRepo.findOne.mockResolvedValue({
        id: 'prog-1',
        userId: 'user-1',
        name: 'Active',
        status: 'active',
        weeks: [],
        totalWeeks: 12,
        primaryGoal: 'hypertrophy',
        experienceLevel: 'intermediate',
        splitType: 'upper_lower',
        weeklyDays: 4,
        isLowIntensityMode: false,
        startedAt: new Date(),
        completedAt: null,
        description: null,
        createdAt: new Date(),
      });
      const result = await service.findActive('user-1');
      expect(result.id).toBe('prog-1');
    });

    it('NotFound если нет активной', async () => {
      programRepo.findOne.mockResolvedValue(null);
      await expect(service.findActive('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivate', () => {
    it('переводит статус в abandoned', async () => {
      const existing = { id: 'prog-1', userId: 'user-1', status: 'active' };
      programRepo.findOne.mockResolvedValue(existing);
      programRepo.save.mockImplementation((p: any) => Promise.resolve(p));
      await service.deactivate('prog-1', 'user-1');
      expect(programRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'abandoned', completedAt: expect.any(Date) }),
      );
    });
  });
});
