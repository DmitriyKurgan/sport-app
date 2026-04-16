import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileService } from '../../profile/profile.service';
import { BodyTypeSnapshot } from '../body-type.entity';
import { BodyTypeService } from '../body-type.service';

describe('BodyTypeService', () => {
  let service: BodyTypeService;
  let repo: jest.Mocked<Repository<BodyTypeSnapshot>>;
  let profileService: jest.Mocked<ProfileService>;

  const mockProfile = {
    weightKg: 80,
    heightCm: 180,
    waistCm: null,
    baselineStrength: { squatKg: null, benchKg: null, deadliftKg: null, pullUpsMaxReps: null },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BodyTypeService,
        {
          provide: getRepositoryToken(BodyTypeSnapshot),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn((x) => x),
            save: jest.fn((x) =>
              Promise.resolve({ ...x, id: 'snap-1', createdAt: new Date() }),
            ),
          },
        },
        {
          provide: ProfileService,
          useValue: {
            findByUserId: jest.fn(),
          },
        },
      ],
    }).compile();
    service = module.get(BodyTypeService);
    repo = module.get(getRepositoryToken(BodyTypeSnapshot));
    profileService = module.get(ProfileService);
  });

  describe('compute (static)', () => {
    it('считает scores + classification для среднего мужчины', () => {
      const { scores, classification } = BodyTypeService.compute({
        weightKg: 80,
        heightCm: 180,
      });
      expect(scores).toHaveProperty('adiposity');
      expect(scores).toHaveProperty('muscularity');
      expect(scores).toHaveProperty('linearity');
      expect(scores.muscularity).toBe(0); // нет e1RM → 0
      expect(classification.type).toBeDefined();
    });

    it('endomorph кейс: 100кг × 170см с большим waist', () => {
      const { classification } = BodyTypeService.compute({
        weightKg: 100,
        heightCm: 170,
        waistCm: 105,
      });
      expect(classification.type).toBe('endomorph');
    });

    it('ectomorph кейс: 60кг × 190см', () => {
      const { classification } = BodyTypeService.compute({
        weightKg: 60,
        heightCm: 190,
      });
      expect(classification.type).toBe('ectomorph');
    });

    it('mesomorph кейс: 78кг × 180см с хорошей силой (подтянутый, adiposity нейтральная)', () => {
      // BMI ≈ 24.1 → adiposity ≈ 0.03 (нейтрально, ниже HIGH)
      // deadlift 160/78 ≈ 2.05 → muscularity z ≈ +2.6 > HIGH
      const { classification } = BodyTypeService.compute({
        weightKg: 78,
        heightCm: 180,
        e1rmSquatKg: 120,
        e1rmBenchKg: 90,
        e1rmDeadliftKg: 160,
      });
      expect(classification.type).toBe('mesomorph');
    });
  });

  describe('recalculate', () => {
    it('загружает профиль и сохраняет snapshot', async () => {
      profileService.findByUserId.mockResolvedValueOnce(mockProfile as any);
      const result = await service.recalculate('user-1');

      expect(profileService.findByUserId).toHaveBeenCalledWith('user-1');
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          classification: expect.any(String),
        }),
      );
      expect(result.id).toBe('snap-1');
    });

    it('использует baseline strength из профиля для muscularity', async () => {
      profileService.findByUserId.mockResolvedValueOnce({
        ...mockProfile,
        baselineStrength: { squatKg: 150, benchKg: 100, deadliftKg: 180, pullUpsMaxReps: null },
      } as any);
      const result = await service.recalculate('user-1');
      expect(result.muscularityScore).toBeGreaterThan(0);
    });
  });

  describe('getCurrent', () => {
    it('возвращает последний snapshot', async () => {
      repo.findOne.mockResolvedValueOnce({
        id: 'snap-1',
        userId: 'user-1',
        adiposityScore: 0.1,
        muscularityScore: 0.2,
        linearityScore: -0.1,
        classification: 'hybrid',
        confidence: 'low',
        dominantComponents: ['muscularity', 'adiposity'],
        createdAt: new Date(),
      } as BodyTypeSnapshot);

      const result = await service.getCurrent('user-1');
      expect(result.id).toBe('snap-1');
    });

    it('lazy: вычисляет если snapshot нет', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      profileService.findByUserId.mockResolvedValueOnce(mockProfile as any);

      const result = await service.getCurrent('user-1');
      expect(result.id).toBe('snap-1');
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    it('возвращает историю с лимитом', async () => {
      repo.find.mockResolvedValueOnce([
        { id: 's1', userId: 'user-1', adiposityScore: 0, muscularityScore: 0, linearityScore: 0, classification: 'hybrid', confidence: 'low', dominantComponents: [], createdAt: new Date() } as BodyTypeSnapshot,
      ]);
      const result = await service.getHistory('user-1', 10);
      expect(result).toHaveLength(1);
      expect(repo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
        take: 10,
      });
    });
  });
});
