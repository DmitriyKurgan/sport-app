import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PreScreeningService } from '../../pre-screening/pre-screening.service';
import { CreateProfileDto } from '../dto/create-profile.dto';
import {
  BodyweightGoal,
  DailyActivityLevel,
  EquipmentAccess,
  ExperienceLevel,
  Gender,
  InjuryFlag,
  NutritionTier,
  PrimaryTrainingGoal,
  StressLevel,
} from '../enums';
import { Profile } from '../profile.entity';
import { ProfileService } from '../profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let repo: jest.Mocked<Repository<Profile>>;
  let preScreening: jest.Mocked<PreScreeningService>;

  const validDto: CreateProfileDto = {
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
    injuryPainFlags: [InjuryFlag.NONE],
    sleepHoursAvg: 7.5,
    stressLevel: StressLevel.LOW,
    dailyActivityLevel: DailyActivityLevel.MODERATE,
    nutritionTierPreference: NutritionTier.STANDARD,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: getRepositoryToken(Profile),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn((x) => x),
            save: jest.fn((x) => Promise.resolve({ ...x, id: 'profile-1', createdAt: new Date(), updatedAt: new Date() })),
            update: jest.fn(),
          },
        },
        {
          provide: PreScreeningService,
          useValue: {
            findLatest: jest.fn(),
          },
        },
      ],
    }).compile();
    service = module.get(ProfileService);
    repo = module.get(getRepositoryToken(Profile));
    preScreening = module.get(PreScreeningService);
  });

  describe('calculateDerivedFields (static, pure)', () => {
    it('считает все derived корректно для мужчины 80×180×28, MODERATE, 4 дня/нед, MAINTAIN, STANDARD', () => {
      const result = ProfileService.calculateDerivedFields({
        sex: Gender.MALE,
        weightKg: 80,
        heightCm: 180,
        ageYears: 28,
        dailyActivityLevel: DailyActivityLevel.MODERATE,
        weeklyTrainingDaysTarget: 4,
        bodyweightGoal: BodyweightGoal.MAINTAIN,
        tier: NutritionTier.STANDARD,
      });
      expect(result.bmi).toBeCloseTo(24.7, 1);
      expect(result.ree).toBe(1790);
      expect(result.activityFactor).toBe(1.725);
      expect(result.tdee).toBe(Math.round(1790 * 1.725));
      expect(result.proteinTargetG).toBe(128);
    });
  });

  describe('create', () => {
    it('создаёт профиль с derived, берёт redFlags=false если скрининга нет', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      preScreening.findLatest.mockRejectedValueOnce(new NotFoundException());

      const result = await service.create('user-1', validDto);

      expect(result.userId).toBe('user-1');
      expect(result.preScreeningRedFlags).toBe(false);
      expect(result.bmi).toBeCloseTo(24.7, 1);
      expect(result.tdee).toBeGreaterThan(2000);
      expect(result.proteinTargetG).toBe(128);
      expect(repo.save).toHaveBeenCalled();
    });

    it('подтягивает preScreeningRedFlags=true из скрининга', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      preScreening.findLatest.mockResolvedValueOnce({
        id: 'scr-1',
        redFlags: true,
        redFlagReasons: ['heart_condition'],
        recommendation: '',
        createdAt: new Date(),
      });

      const result = await service.create('user-1', validDto);
      expect(result.preScreeningRedFlags).toBe(true);
    });

    it('ConflictException если профиль уже существует', async () => {
      repo.findOne.mockResolvedValueOnce({ id: 'existing' } as Profile);
      await expect(service.create('user-1', validDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findByUserId', () => {
    it('возвращает профиль с derived + proteinTargetG', async () => {
      repo.findOne.mockResolvedValueOnce({
        id: 'profile-1',
        userId: 'user-1',
        sex: Gender.MALE,
        weightKg: 80,
        heightCm: 180,
        ageYears: 28,
        bmi: 24.7,
        ree: 1790,
        tdee: 2775,
        activityFactor: 1.55,
        bodyweightGoal: BodyweightGoal.MAINTAIN,
        nutritionTierPreference: NutritionTier.STANDARD,
        baselineSquatKg: null,
        baselineBenchKg: null,
        baselineDeadliftKg: null,
        baselinePullupsMax: null,
      } as unknown as Profile);

      const result = await service.findByUserId('user-1');
      expect(result.proteinTargetG).toBe(128);
    });

    it('NotFound если профиля нет', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      await expect(service.findByUserId('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('пересчитывает derived при изменении веса', async () => {
      const existing = {
        id: 'profile-1',
        userId: 'user-1',
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
        injuryPainFlags: [InjuryFlag.NONE],
        sleepHoursAvg: 7.5,
        stressLevel: StressLevel.LOW,
        dailyActivityLevel: DailyActivityLevel.MODERATE,
        nutritionTierPreference: NutritionTier.STANDARD,
        dietaryRestrictions: [],
        baselineSquatKg: null,
        baselineBenchKg: null,
        baselineDeadliftKg: null,
        baselinePullupsMax: null,
        preScreeningRedFlags: false,
      } as unknown as Profile;
      repo.findOne.mockResolvedValueOnce(existing);

      const result = await service.update('user-1', { weightKg: 85 });
      expect(result.weightKg).toBe(85);
      expect(result.bmi).not.toBeCloseTo(24.7, 1); // BMI пересчитан
      expect(repo.save).toHaveBeenCalled();
    });
  });
});
