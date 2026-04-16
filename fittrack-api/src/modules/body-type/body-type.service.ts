import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileService } from '../profile/profile.service';
import { BodyTypeSnapshot } from './body-type.entity';
import {
  calculateAdiposityScore,
  calculateLinearityScore,
  calculateMuscularityScore,
  classify,
} from './calculators';
import { BodyTypeResponseDto } from './dto/body-type-response.dto';
import { BodyScores, ScoringInputs } from './interfaces';

@Injectable()
export class BodyTypeService {
  private readonly logger = new Logger(BodyTypeService.name);

  constructor(
    @InjectRepository(BodyTypeSnapshot)
    private readonly repo: Repository<BodyTypeSnapshot>,
    private readonly profileService: ProfileService,
  ) {}

  async recalculate(userId: string): Promise<BodyTypeResponseDto> {
    const inputs = await this.gatherInputs(userId);
    return this.persistSnapshot(userId, inputs);
  }

  async getCurrent(userId: string): Promise<BodyTypeResponseDto> {
    const latest = await this.repo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    if (!latest) {
      // lazily посчитать, если ни одного snapshot'а ещё нет
      return this.recalculate(userId);
    }
    return BodyTypeResponseDto.fromEntity(latest);
  }

  async getHistory(userId: string, limit = 50): Promise<BodyTypeResponseDto[]> {
    const snapshots = await this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return snapshots.map(BodyTypeResponseDto.fromEntity);
  }

  /**
   * Pure: по ScoringInputs собирает scores + classification.
   * Вынесено в static для тестируемости.
   */
  static compute(inputs: ScoringInputs): {
    scores: BodyScores;
    classification: ReturnType<typeof classify>;
  } {
    const scores: BodyScores = {
      adiposity: calculateAdiposityScore(inputs),
      muscularity: calculateMuscularityScore(inputs),
      linearity: calculateLinearityScore(inputs),
    };
    const classification = classify(scores);
    return { scores, classification };
  }

  // === private ===

  /**
   * Собирает входы из Profile и (в будущем) Measurements / Progress.
   * На этапе 4 доступен только Profile — остальные поля остаются null.
   * После реализации ProgressModule/BodyMeasurements эти хвосты будут заполняться.
   */
  private async gatherInputs(userId: string): Promise<ScoringInputs> {
    const profile = await this.profileService.findByUserId(userId);
    return {
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      waistCm: profile.waistCm,
      // На этапе 4 у нас пока нет логов прогресса → используем baseline если есть.
      e1rmSquatKg: profile.baselineStrength.squatKg,
      e1rmBenchKg: profile.baselineStrength.benchKg,
      e1rmDeadliftKg: profile.baselineStrength.deadliftKg,
      // chest/biceps-окружности придут из BodyMeasurements на этапе 8.
    };
  }

  private async persistSnapshot(
    userId: string,
    inputs: ScoringInputs,
  ): Promise<BodyTypeResponseDto> {
    const { scores, classification } = BodyTypeService.compute(inputs);

    const draft = this.repo.create({
      userId,
      adiposityScore: scores.adiposity,
      muscularityScore: scores.muscularity,
      linearityScore: scores.linearity,
      classification: classification.type,
      dominantComponents: classification.dominantComponents,
      confidence: classification.confidence,
    });
    const saved = await this.repo.save(draft);

    this.logger.log(
      `BodyType recalculated: userId=${userId}, type=${classification.type}, confidence=${classification.confidence}`,
    );

    return BodyTypeResponseDto.fromEntity(saved);
  }
}
