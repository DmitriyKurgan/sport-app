import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BodyTypeService } from '../../body-type/body-type.service';
import { ProfileService } from '../../profile/profile.service';
import { AvatarSnapshot } from '../avatar.entity';
import { AvatarService } from '../avatar.service';

describe('AvatarService', () => {
  let service: AvatarService;
  let repo: jest.Mocked<Repository<AvatarSnapshot>>;
  let profileService: jest.Mocked<ProfileService>;
  let bodyTypeService: jest.Mocked<BodyTypeService>;

  const mockProfile = {
    sex: 'male',
    heightCm: 180,
    weightKg: 80,
    bmi: 24.7,
    waistCm: null,
  };

  const mockScoring = {
    adiposityScore: 0.1,
    muscularityScore: 0.5,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AvatarService,
        {
          provide: getRepositoryToken(AvatarSnapshot),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn((x) => x),
            save: jest.fn((x) => Promise.resolve({ ...x, id: 'avatar-1', createdAt: new Date() })),
          },
        },
        {
          provide: ProfileService,
          useValue: {
            findByUserId: jest.fn(),
          },
        },
        {
          provide: BodyTypeService,
          useValue: {
            getCurrent: jest.fn(),
          },
        },
      ],
    }).compile();
    service = module.get(AvatarService);
    repo = module.get(getRepositoryToken(AvatarSnapshot));
    profileService = module.get(ProfileService);
    bodyTypeService = module.get(BodyTypeService);
  });

  describe('recalculate', () => {
    it('собирает данные и сохраняет snapshot', async () => {
      profileService.findByUserId.mockResolvedValueOnce(mockProfile as any);
      bodyTypeService.getCurrent.mockResolvedValueOnce(mockScoring as any);

      const result = await service.recalculate('user-1');

      expect(result.id).toBe('avatar-1');
      expect(result.heightScale).toBeCloseTo(180 / 175, 2);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' }),
      );
    });

    it('использует muscularity для armGirth если нет bicepsCm', async () => {
      profileService.findByUserId.mockResolvedValueOnce(mockProfile as any);
      bodyTypeService.getCurrent.mockResolvedValueOnce({
        ...mockScoring,
        muscularityScore: 2.0,
      } as any);

      const result = await service.recalculate('user-1');
      expect(result.armGirth).toBeGreaterThan(1.0);
    });
  });

  describe('getCurrent', () => {
    it('возвращает последний snapshot', async () => {
      repo.findOne.mockResolvedValueOnce({
        id: 'avatar-1',
        userId: 'user-1',
        heightScale: 1.03,
        shoulderWidth: 1.0,
        chestDepth: 1.0,
        waistWidth: 1.0,
        hipWidth: 1.0,
        armGirth: 1.0,
        thighGirth: 1.0,
        muscleDefinition: 0.6,
        bodyFatLayer: 0.4,
        createdAt: new Date(),
      } as AvatarSnapshot);

      const result = await service.getCurrent('user-1');
      expect(result.id).toBe('avatar-1');
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('lazy: пересчитывает если snapshot нет', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      profileService.findByUserId.mockResolvedValueOnce(mockProfile as any);
      bodyTypeService.getCurrent.mockResolvedValueOnce(mockScoring as any);

      const result = await service.getCurrent('user-1');
      expect(result.id).toBe('avatar-1');
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('getTransformation', () => {
    const oldSnap = {
      id: 'old',
      userId: 'user-1',
      heightScale: 1.0,
      shoulderWidth: 1.0,
      chestDepth: 1.1,
      waistWidth: 1.15,
      hipWidth: 1.05,
      armGirth: 1.0,
      thighGirth: 1.0,
      muscleDefinition: 0.3,
      bodyFatLayer: 0.6,
      createdAt: new Date('2026-01-01'),
    } as AvatarSnapshot;

    const newSnap = {
      ...oldSnap,
      id: 'new',
      waistWidth: 0.95,
      muscleDefinition: 0.6,
      bodyFatLayer: 0.3,
      createdAt: new Date('2026-04-01'),
    } as AvatarSnapshot;

    it('без дат: берёт oldest и latest', async () => {
      // Первый вызов (findOldest) → oldSnap, второй (findLatest) → newSnap
      repo.findOne
        .mockResolvedValueOnce(oldSnap)
        .mockResolvedValueOnce(newSnap);

      const result = await service.getTransformation('user-1');

      expect(result.from.id).toBe('old');
      expect(result.to.id).toBe('new');
      expect(result.delta.waistWidth).toBeLessThan(0); // талия уменьшилась
      expect(result.delta.muscleDefinition).toBeGreaterThan(0); // рельеф вырос
      expect(result.delta.bodyFatLayer).toBeLessThan(0); // жир уменьшился
    });

    it('с диапазоном дат: ищет ближайшие', async () => {
      repo.findOne
        .mockResolvedValueOnce(oldSnap)
        .mockResolvedValueOnce(newSnap);

      const result = await service.getTransformation(
        'user-1',
        new Date('2026-01-15'),
        new Date('2026-03-15'),
      );
      expect(result.delta).toBeDefined();
    });

    it('NotFound если snapshot-ов недостаточно', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.getTransformation('user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
