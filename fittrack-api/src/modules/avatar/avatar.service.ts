import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { BodyTypeService } from '../body-type/body-type.service';
import { Gender } from '../profile/enums';
import { ProfileService } from '../profile/profile.service';
import { AvatarSnapshot } from './avatar.entity';
import {
  AvatarParamsInputs,
  calculateAvatarDelta,
  calculateAvatarParams,
} from './calculators';
import { AvatarResponseDto, AvatarTransformationDto } from './dto/avatar-response.dto';

@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name);

  constructor(
    @InjectRepository(AvatarSnapshot)
    private readonly repo: Repository<AvatarSnapshot>,
    private readonly profileService: ProfileService,
    private readonly bodyTypeService: BodyTypeService,
  ) {}

  async recalculate(userId: string): Promise<AvatarResponseDto> {
    const inputs = await this.gatherInputs(userId);
    const params = calculateAvatarParams(inputs);

    const draft = this.repo.create({ userId, ...params });
    const saved = await this.repo.save(draft);

    this.logger.log(
      `Avatar recalculated: userId=${userId}, bodyFat=${params.bodyFatLayer}, muscle=${params.muscleDefinition}`,
    );

    return AvatarResponseDto.fromEntity(saved);
  }

  async getCurrent(userId: string): Promise<AvatarResponseDto> {
    const latest = await this.repo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    if (!latest) {
      // lazy: пересчитать на лету
      return this.recalculate(userId);
    }
    return AvatarResponseDto.fromEntity(latest);
  }

  /**
   * Возвращает from/to snapshot'ы и дельты по каждому параметру.
   * Если from/to не заданы:
   *   from = самый старый snapshot
   *   to   = самый свежий snapshot
   */
  async getTransformation(
    userId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<AvatarTransformationDto> {
    const from = fromDate
      ? await this.findNearest(userId, fromDate, 'asc')
      : await this.findOldest(userId);

    const to = toDate
      ? await this.findNearest(userId, toDate, 'desc')
      : await this.findLatest(userId);

    if (!from || !to) {
      throw new NotFoundException('Недостаточно snapshot-ов для трансформации');
    }

    const fromDto = AvatarResponseDto.fromEntity(from);
    const toDto = AvatarResponseDto.fromEntity(to);
    return {
      from: fromDto,
      to: toDto,
      delta: calculateAvatarDelta(fromDto, toDto),
    };
  }

  // === private ===

  private async gatherInputs(userId: string): Promise<AvatarParamsInputs> {
    const [profile, scoring] = await Promise.all([
      this.profileService.findByUserId(userId),
      this.bodyTypeService.getCurrent(userId),
    ]);

    return {
      sex: profile.sex as Gender.MALE | Gender.FEMALE,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      bmi: profile.bmi,
      waistCm: profile.waistCm,
      // chest/biceps/thigh/hips придут из BodyMeasurementService на этапе 8
      adiposityScore: scoring.adiposityScore,
      muscularityScore: scoring.muscularityScore,
    };
  }

  private async findLatest(userId: string): Promise<AvatarSnapshot | null> {
    return this.repo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  private async findOldest(userId: string): Promise<AvatarSnapshot | null> {
    return this.repo.findOne({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Находит snapshot ближайший к дате:
   *   direction='asc' (для from): берём первый snapshot ПОСЛЕ даты
   *   direction='desc' (для to): берём последний snapshot ДО даты
   */
  private async findNearest(
    userId: string,
    date: Date,
    direction: 'asc' | 'desc',
  ): Promise<AvatarSnapshot | null> {
    return this.repo.findOne({
      where: {
        userId,
        createdAt: direction === 'asc' ? MoreThanOrEqual(date) : LessThanOrEqual(date),
      },
      order: { createdAt: direction === 'asc' ? 'ASC' : 'DESC' },
    });
  }
}
