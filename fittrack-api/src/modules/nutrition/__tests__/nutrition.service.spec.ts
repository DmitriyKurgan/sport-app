import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DietaryRestriction, NutritionTier } from '../../profile/enums';
import { ProfileService } from '../../profile/profile.service';
import { TrainingProgramService } from '../../training/services/training-program.service';
import { MealTemplate, NutritionPlan } from '../entities';
import { NutritionService } from '../nutrition.service';

describe('NutritionService', () => {
  let service: NutritionService;
  let planRepo: any;
  let templateRepo: any;
  let dataSource: any;
  let profileService: jest.Mocked<ProfileService>;
  let programService: jest.Mocked<TrainingProgramService>;

  const mockProfile = {
    sex: 'male',
    weightKg: 80,
    heightCm: 180,
    ageYears: 28,
    bodyweightGoal: 'maintain',
    nutritionTierPreference: NutritionTier.STANDARD,
    dietaryRestrictions: [],
    tdee: 2500,
  };

  beforeEach(async () => {
    const mockManager = {
      getRepository: jest.fn(() => ({
        update: jest.fn(),
        save: jest.fn().mockImplementation((p) => Promise.resolve({ ...p, id: 'plan-1' })),
        findOneOrFail: jest.fn().mockResolvedValue({
          id: 'plan-1',
          userId: 'user-1',
          tier: 'standard',
          bodyweightGoal: 'maintain',
          currentPhase: null,
          caloriesTarget: 2500,
          proteinG: 128,
          fatG: 70,
          carbsG: 320,
          proteinPerMealG: 20,
          mealsPerDay: 4,
          supplements: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          meals: [],
        }),
      })),
    };

    const module = await Test.createTestingModule({
      providers: [
        NutritionService,
        {
          provide: getRepositoryToken(NutritionPlan),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn((p) => Promise.resolve(p)),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(MealTemplate),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((cb) => cb(mockManager)),
          },
        },
        {
          provide: ProfileService,
          useValue: {
            findByUserId: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: TrainingProgramService,
          useValue: {
            findActive: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(NutritionService);
    planRepo = module.get(getRepositoryToken(NutritionPlan));
    templateRepo = module.get(getRepositoryToken(MealTemplate));
    dataSource = module.get(DataSource);
    profileService = module.get(ProfileService);
    programService = module.get(TrainingProgramService);
  });

  describe('isDietCompatible (static)', () => {
    it('пустые restrictions → совместимо со всем', () => {
      expect(NutritionService.isDietCompatible(['vegan' as any], [])).toBe(true);
    });

    it('NONE в restrictions → совместимо', () => {
      expect(
        NutritionService.isDietCompatible([], [DietaryRestriction.NONE]),
      ).toBe(true);
    });

    it('vegetarian user × vegetarian template → ok', () => {
      expect(
        NutritionService.isDietCompatible(
          [DietaryRestriction.VEGETARIAN],
          [DietaryRestriction.VEGETARIAN],
        ),
      ).toBe(true);
    });

    it('vegan user × только vegetarian template → НЕ совместимо', () => {
      expect(
        NutritionService.isDietCompatible(
          [DietaryRestriction.VEGETARIAN],
          [DietaryRestriction.VEGAN],
        ),
      ).toBe(false);
    });

    it('пользователь с несколькими ограничениями: все должны быть в шаблоне', () => {
      expect(
        NutritionService.isDietCompatible(
          [DietaryRestriction.VEGETARIAN, DietaryRestriction.GLUTEN_FREE],
          [DietaryRestriction.VEGETARIAN, DietaryRestriction.GLUTEN_FREE],
        ),
      ).toBe(true);
      expect(
        NutritionService.isDietCompatible(
          [DietaryRestriction.VEGETARIAN], // gluten_free отсутствует
          [DietaryRestriction.VEGETARIAN, DietaryRestriction.GLUTEN_FREE],
        ),
      ).toBe(false);
    });
  });

  describe('greedySelect (static)', () => {
    const mkTemplate = (slug: string, calories: number, protein: number) =>
      ({
        slug,
        calories,
        proteinG: protein,
        dayTemplate: 'training_day',
      }) as MealTemplate;

    it('выбирает high-protein шаблоны первыми', () => {
      const templates = [
        mkTemplate('low_p', 500, 10),
        mkTemplate('high_p', 500, 40),
      ];
      const result = NutritionService.greedySelect(templates, 1000);
      expect(result[0].slug).toBe('high_p');
    });

    it('не превышает upperBound (caloriesTarget × 1.05)', () => {
      const templates = [
        mkTemplate('a', 400, 30),
        mkTemplate('b', 400, 25),
        mkTemplate('c', 400, 20),
      ];
      const result = NutritionService.greedySelect(templates, 800);
      const total = result.reduce((s, t) => s + t.calories, 0);
      expect(total).toBeLessThanOrEqual(800 * 1.05);
    });

    it('добирает до 80% если рамки слишком узкие', () => {
      const templates = [
        mkTemplate('big', 1500, 50),
        mkTemplate('big2', 1500, 50),
      ];
      const result = NutritionService.greedySelect(templates, 1000, 5);
      expect(result.length).toBeGreaterThan(0);
    });

    it('лимит maxMeals соблюдается', () => {
      const templates = Array.from({ length: 10 }, (_, i) =>
        mkTemplate(`t${i}`, 100, 10),
      );
      const result = NutritionService.greedySelect(templates, 5000, 3);
      expect(result.length).toBeLessThanOrEqual(3);
    });
  });

  describe('defaultSupplements (static)', () => {
    it('advanced → креатин', () => {
      const sup = NutritionService.defaultSupplements(NutritionTier.ADVANCED);
      expect(sup).not.toBeNull();
      expect(sup![0].name).toMatch(/Creatine/);
    });

    it('budget/standard → null', () => {
      expect(NutritionService.defaultSupplements(NutritionTier.BUDGET)).toBeNull();
      expect(NutritionService.defaultSupplements(NutritionTier.STANDARD)).toBeNull();
    });
  });

  describe('generatePlan', () => {
    it('создаёт план с derived calories + macros, деактивирует старый', async () => {
      profileService.findByUserId.mockResolvedValue(mockProfile as any);
      programService.findActive.mockRejectedValue(new NotFoundException());
      templateRepo.find.mockResolvedValue([
        {
          id: 'mt-1',
          slug: 't1',
          tier: 'standard',
          dayTemplate: 'training_day',
          calories: 500,
          proteinG: 30,
          fatG: 15,
          carbsG: 60,
          dietaryTags: [],
          isActive: true,
        },
      ]);

      const result = await service.generatePlan('user-1');

      expect(profileService.findByUserId).toHaveBeenCalledWith('user-1');
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result.id).toBe('plan-1');
    });
  });

  describe('recalibrate', () => {
    const mkPlan = (overrides = {}) =>
      ({
        id: 'plan-1',
        userId: 'user-1',
        tier: NutritionTier.STANDARD,
        bodyweightGoal: 'cut',
        caloriesTarget: 2200,
        proteinG: 128,
        fatG: 60,
        carbsG: 280,
        proteinPerMealG: 20,
        mealsPerDay: 4,
        supplements: null,
        isActive: true,
        meals: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        currentPhase: null,
        ...overrides,
      }) as NutritionPlan;

    it('cut + плато → −100 ккал', async () => {
      planRepo.findOne.mockResolvedValue(mkPlan());
      profileService.findByUserId.mockResolvedValue(mockProfile as any);

      const result = await service.recalibrate('user-1', 0.1); // |0.1| < 0.3 → плато
      expect(result.caloriesTarget).toBe(2100);
    });

    it('bulk + плато → +100 ккал', async () => {
      planRepo.findOne.mockResolvedValue(mkPlan({ bodyweightGoal: 'bulk' }));
      profileService.findByUserId.mockResolvedValue(mockProfile as any);

      const result = await service.recalibrate('user-1', 0.0);
      expect(result.caloriesTarget).toBe(2300);
    });

    it('тренд явно идёт → не меняет калории', async () => {
      planRepo.findOne.mockResolvedValue(mkPlan());
      profileService.findByUserId.mockResolvedValue(mockProfile as any);

      const result = await service.recalibrate('user-1', -0.5); // вес падает по плану
      expect(result.caloriesTarget).toBe(2200);
    });

    it('NotFound если плана нет', async () => {
      planRepo.findOne.mockResolvedValue(null);
      await expect(service.recalibrate('user-1', 0)).rejects.toThrow(NotFoundException);
    });

    it('safeguard: cut не уходит ниже tdee−600', async () => {
      planRepo.findOne.mockResolvedValue(
        mkPlan({ caloriesTarget: 1900 }), // tdee=2500, мин 1900
      );
      profileService.findByUserId.mockResolvedValue(mockProfile as any);

      const result = await service.recalibrate('user-1', 0.0); // плато → −100 → 1800
      expect(result.caloriesTarget).toBe(1900); // cap на 2500−600=1900
    });
  });
});
