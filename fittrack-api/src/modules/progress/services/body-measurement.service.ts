import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { CreateBodyMeasurementDto } from '../dto/create-body-measurement.dto';
import {
  BodyMeasurementResponseDto,
  WeightTrendPointDto,
} from '../dto/response.dto';
import { BodyMeasurement } from '../entities';
import { BODY_MEASUREMENT_ADDED, BodyMeasurementAddedEvent } from '../events';

@Injectable()
export class BodyMeasurementService {
  constructor(
    @InjectRepository(BodyMeasurement)
    private readonly repo: Repository<BodyMeasurement>,
    private readonly events: EventEmitter2,
  ) {}

  async create(
    userId: string,
    dto: CreateBodyMeasurementDto,
  ): Promise<BodyMeasurementResponseDto> {
    const measurement = this.repo.create({
      userId,
      weightKg: dto.weightKg,
      bodyFatPercent: dto.bodyFatPercent ?? null,
      chestCm: dto.chestCm ?? null,
      waistCm: dto.waistCm ?? null,
      hipsCm: dto.hipsCm ?? null,
      bicepsCm: dto.bicepsCm ?? null,
      thighCm: dto.thighCm ?? null,
      photoUrl: dto.photoUrl ?? null,
      measuredAt: new Date(),
    });
    const saved = await this.repo.save(measurement);

    const event: BodyMeasurementAddedEvent = {
      userId: saved.userId,
      weightKg: saved.weightKg,
      measuredAt: saved.measuredAt,
    };
    this.events.emit(BODY_MEASUREMENT_ADDED, event);

    return BodyMeasurementResponseDto.fromEntity(saved);
  }

  async findAll(userId: string): Promise<BodyMeasurementResponseDto[]> {
    const items = await this.repo.find({
      where: { userId },
      order: { measuredAt: 'DESC' },
    });
    return items.map(BodyMeasurementResponseDto.fromEntity);
  }

  async findLatest(userId: string): Promise<BodyMeasurementResponseDto> {
    const latest = await this.repo.findOne({
      where: { userId },
      order: { measuredAt: 'DESC' },
    });
    if (!latest) throw new NotFoundException('Замеры тела не найдены');
    return BodyMeasurementResponseDto.fromEntity(latest);
  }

  /**
   * Тренд веса с rolling avg 7 и 14 дней.
   * Берём все замеры за последние `days` дней, сортируем по дате,
   * для каждой точки считаем среднее за окно [date-N..date].
   */
  async getWeightTrend(userId: string, days = 30): Promise<WeightTrendPointDto[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const items = await this.repo.find({
      where: { userId, measuredAt: MoreThanOrEqual(since) },
      order: { measuredAt: 'ASC' },
    });

    return BodyMeasurementService.computeWeightTrend(
      items.map((m) => ({ date: m.measuredAt, weightKg: m.weightKg })),
    );
  }

  /**
   * Pure: считает rolling avg 7d и 14d для отсортированных точек.
   * Static — для тестируемости и переиспользования (например, в Analytics).
   */
  static computeWeightTrend(
    points: Array<{ date: Date; weightKg: number }>,
  ): WeightTrendPointDto[] {
    return points.map((point) => {
      const avg7d = BodyMeasurementService.windowAvg(points, point.date, 7);
      const avg14d = BodyMeasurementService.windowAvg(points, point.date, 14);
      return {
        date: point.date,
        weightKg: point.weightKg,
        avg7d,
        avg14d,
      };
    });
  }

  private static windowAvg(
    points: Array<{ date: Date; weightKg: number }>,
    until: Date,
    windowDays: number,
  ): number | null {
    const from = new Date(until.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const inWindow = points.filter((p) => p.date >= from && p.date <= until);
    if (inWindow.length === 0) return null;
    const sum = inWindow.reduce((s, p) => s + p.weightKg, 0);
    return Math.round((sum / inWindow.length) * 100) / 100;
  }
}
