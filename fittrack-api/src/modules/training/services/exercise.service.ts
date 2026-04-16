import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, ArrayOverlap, Between, FindOptionsWhere, Repository } from 'typeorm';
import { AppCacheService, CACHE_TTL, cacheKeys } from '../../cache';
import { EQUIPMENT_ACCESS_RANK, EquipmentAccess } from '../../profile/enums';
import { ExerciseCatalogItem } from '../../training-engine';
import { CatalogQueryDto } from '../dto/catalog-query.dto';
import { Exercise } from '../entities';

@Injectable()
export class ExerciseService {
  constructor(
    @InjectRepository(Exercise)
    private readonly repo: Repository<Exercise>,
    private readonly cache: AppCacheService,
  ) {}

  /**
   * Получить упражнения для TrainingEngine: фильтр по equipmentAccess и активные.
   * Кэшируется по equipmentAccess (1ч) — каталог редко меняется.
   */
  async loadCatalogForEngine(equipmentAccess: EquipmentAccess): Promise<ExerciseCatalogItem[]> {
    return this.cache.getOrCompute(
      cacheKeys.exerciseCatalogByEquipment(equipmentAccess),
      CACHE_TTL.CATALOG_SECONDS,
      async () => {
        const userRank = EQUIPMENT_ACCESS_RANK[equipmentAccess];
        const all = await this.repo.find({ where: { isActive: true } });
        return all
          .filter((ex) => EQUIPMENT_ACCESS_RANK[ex.equipmentAccessMin] <= userRank)
          .map((ex) => this.toEngineItem(ex));
      },
    );
  }

  /** Все активные упражнения (для engine). */
  async loadAllActive(): Promise<ExerciseCatalogItem[]> {
    return this.cache.getOrCompute(
      cacheKeys.exerciseCatalog(),
      CACHE_TTL.CATALOG_SECONDS,
      async () => {
        const all = await this.repo.find({ where: { isActive: true } });
        return all.map((ex) => this.toEngineItem(ex));
      },
    );
  }

  /**
   * Публичный catalog query (для фронта): с фильтрами и пагинацией.
   */
  async findCatalog(query: CatalogQueryDto): Promise<{ items: Exercise[]; total: number }> {
    const where: FindOptionsWhere<Exercise> = { isActive: true };

    if (query.patterns?.length) {
      where.movementPatterns = ArrayOverlap(query.patterns) as any;
    }
    if (query.muscles?.length) {
      where.primaryMuscles = ArrayOverlap(query.muscles) as any;
    }

    const limit = query.limit ?? 50;

    const [items, total] = await this.repo.findAndCount({
      where,
      take: limit,
      order: { difficulty: 'ASC', name: 'ASC' },
    });

    // equipmentAccess + difficulty range фильтруем в памяти
    let filtered = items;
    if (query.equipmentAccess) {
      const userRank = EQUIPMENT_ACCESS_RANK[query.equipmentAccess];
      filtered = filtered.filter(
        (ex) => EQUIPMENT_ACCESS_RANK[ex.equipmentAccessMin] <= userRank,
      );
    }
    if (query.difficultyMin !== undefined) {
      filtered = filtered.filter((ex) => ex.difficulty >= query.difficultyMin!);
    }
    if (query.difficultyMax !== undefined) {
      filtered = filtered.filter((ex) => ex.difficulty <= query.difficultyMax!);
    }

    return { items: filtered, total };
  }

  async findBySlug(slug: string): Promise<Exercise> {
    const ex = await this.repo.findOne({ where: { slug, isActive: true } });
    if (!ex) throw new NotFoundException(`Упражнение "${slug}" не найдено`);
    return ex;
  }

  async findById(id: string): Promise<Exercise> {
    const ex = await this.repo.findOne({ where: { id, isActive: true } });
    if (!ex) throw new NotFoundException('Упражнение не найдено');
    return ex;
  }

  /** Entity → engine-view. Чистая функция. */
  private toEngineItem(ex: Exercise): ExerciseCatalogItem {
    return {
      id: ex.id,
      slug: ex.slug,
      name: ex.name,
      nameRu: ex.nameRu,
      movementPatterns: ex.movementPatterns,
      primaryMuscles: ex.primaryMuscles,
      secondaryMuscles: ex.secondaryMuscles,
      jointInvolvement: ex.jointInvolvement,
      contraindications: ex.contraindications,
      equipmentRequired: ex.equipmentRequired,
      equipmentAccessMin: ex.equipmentAccessMin,
      difficulty: ex.difficulty,
      technicalDemand: ex.technicalDemand,
      progressionChain: ex.progressionChain,
      progressionOrder: ex.progressionOrder,
    };
  }
}
