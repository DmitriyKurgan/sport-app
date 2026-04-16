import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { cacheServiceProvider } from '../../cache/__tests__/cache-mock';
import { EquipmentAccess } from '../../profile/enums';
import { Exercise } from '../entities';
import { ExerciseService } from '../services/exercise.service';

describe('ExerciseService', () => {
  let service: ExerciseService;
  let repo: jest.Mocked<Repository<Exercise>>;

  const mkEx = (overrides: Partial<Exercise> = {}): Exercise =>
    ({
      id: 'id-1',
      slug: 'pushup',
      name: 'Push-up',
      nameRu: 'Отжимания',
      description: null,
      movementPatterns: ['horizontal_push'] as any,
      primaryMuscles: ['chest'] as any,
      secondaryMuscles: [],
      jointInvolvement: ['shoulder'] as any,
      contraindications: [],
      equipmentRequired: ['bodyweight'],
      equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
      difficulty: 2,
      technicalDemand: 'low',
      progressionChain: null,
      progressionOrder: null,
      instructions: null,
      videoUrl: null,
      imageUrl: null,
      isActive: true,
      createdAt: new Date(),
      ...overrides,
    }) as Exercise;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ExerciseService,
        cacheServiceProvider,
        {
          provide: getRepositoryToken(Exercise),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
          },
        },
      ],
    }).compile();
    service = module.get(ExerciseService);
    repo = module.get(getRepositoryToken(Exercise));
  });

  describe('loadCatalogForEngine', () => {
    it('фильтрует по equipmentAccessMin <= userAccess', async () => {
      repo.find.mockResolvedValue([
        mkEx({ slug: 'bw', equipmentAccessMin: EquipmentAccess.BODYWEIGHT }),
        mkEx({ slug: 'gym', equipmentAccessMin: EquipmentAccess.GYM }),
        mkEx({ slug: 'adv', equipmentAccessMin: EquipmentAccess.ADVANCED_GYM }),
      ]);
      const result = await service.loadCatalogForEngine(EquipmentAccess.GYM);
      expect(result.map((r) => r.slug)).toEqual(['bw', 'gym']);
    });

    it('bodyweight → только bodyweight упражнения', async () => {
      repo.find.mockResolvedValue([
        mkEx({ slug: 'bw', equipmentAccessMin: EquipmentAccess.BODYWEIGHT }),
        mkEx({ slug: 'dumb', equipmentAccessMin: EquipmentAccess.HOME_DUMBBELLS }),
      ]);
      const result = await service.loadCatalogForEngine(EquipmentAccess.BODYWEIGHT);
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('bw');
    });

    it('маппит entity → ExerciseCatalogItem (engine view)', async () => {
      repo.find.mockResolvedValue([mkEx()]);
      const result = await service.loadCatalogForEngine(EquipmentAccess.GYM);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'id-1',
          slug: 'pushup',
          movementPatterns: ['horizontal_push'],
          primaryMuscles: ['chest'],
        }),
      );
    });
  });

  describe('findBySlug', () => {
    it('находит активное упражнение', async () => {
      repo.findOne.mockResolvedValue(mkEx());
      const result = await service.findBySlug('pushup');
      expect(result.slug).toBe('pushup');
    });

    it('NotFound если не найдено', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findBySlug('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findCatalog', () => {
    it('применяет фильтр equipmentAccess в памяти', async () => {
      repo.findAndCount.mockResolvedValue([
        [
          mkEx({ slug: 'bw', equipmentAccessMin: EquipmentAccess.BODYWEIGHT }),
          mkEx({ slug: 'gym', equipmentAccessMin: EquipmentAccess.GYM }),
        ],
        2,
      ]);
      const result = await service.findCatalog({
        equipmentAccess: EquipmentAccess.BODYWEIGHT,
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].slug).toBe('bw');
    });

    it('фильтр по диапазону difficulty', async () => {
      repo.findAndCount.mockResolvedValue([
        [mkEx({ difficulty: 1 }), mkEx({ difficulty: 3 }), mkEx({ difficulty: 5 })],
        3,
      ]);
      const result = await service.findCatalog({ difficultyMin: 2, difficultyMax: 4 });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].difficulty).toBe(3);
    });
  });
});
