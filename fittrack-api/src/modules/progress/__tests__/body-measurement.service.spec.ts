import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BodyMeasurement } from '../entities';
import { BODY_MEASUREMENT_ADDED } from '../events';
import { BodyMeasurementService } from '../services/body-measurement.service';

describe('BodyMeasurementService', () => {
  let service: BodyMeasurementService;
  let repo: jest.Mocked<Repository<BodyMeasurement>>;
  let events: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BodyMeasurementService,
        {
          provide: getRepositoryToken(BodyMeasurement),
          useValue: {
            create: jest.fn((x) => x),
            save: jest.fn((x) => Promise.resolve({ ...x, id: 'm-1', measuredAt: new Date() })),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();
    service = module.get(BodyMeasurementService);
    repo = module.get(getRepositoryToken(BodyMeasurement));
    events = module.get(EventEmitter2);
  });

  describe('create', () => {
    it('сохраняет замер и эмитит событие', async () => {
      const result = await service.create('user-1', { weightKg: 80, waistCm: 85 });
      expect(result.weightKg).toBe(80);
      expect(events.emit).toHaveBeenCalledWith(BODY_MEASUREMENT_ADDED, expect.any(Object));
    });
  });

  describe('findLatest', () => {
    it('возвращает последний замер', async () => {
      repo.findOne.mockResolvedValue({
        id: 'm-1',
        userId: 'user-1',
        weightKg: 80,
        bodyFatPercent: null,
        chestCm: null,
        waistCm: null,
        hipsCm: null,
        bicepsCm: null,
        thighCm: null,
        photoUrl: null,
        measuredAt: new Date(),
        createdAt: new Date(),
      } as BodyMeasurement);
      const result = await service.findLatest('user-1');
      expect(result.id).toBe('m-1');
    });

    it('NotFound если замеров нет', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findLatest('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('computeWeightTrend (static, pure)', () => {
    it('rolling avg 7d на одной точке = сама точка', () => {
      const points = [{ date: new Date('2026-04-01'), weightKg: 80 }];
      const result = BodyMeasurementService.computeWeightTrend(points);
      expect(result[0].avg7d).toBe(80);
      expect(result[0].avg14d).toBe(80);
    });

    it('rolling avg усредняет точки в окне', () => {
      const points = [
        { date: new Date('2026-04-01'), weightKg: 82 },
        { date: new Date('2026-04-03'), weightKg: 80 },
        { date: new Date('2026-04-05'), weightKg: 78 },
      ];
      const result = BodyMeasurementService.computeWeightTrend(points);
      // На последней точке 7-day window включает все 3 → avg = 80
      expect(result[2].avg7d).toBeCloseTo(80, 1);
    });

    it('точки за пределами окна не учитываются', () => {
      const points = [
        { date: new Date('2026-04-01'), weightKg: 90 }, // вне 7-day окна для 04-15
        { date: new Date('2026-04-14'), weightKg: 80 },
        { date: new Date('2026-04-15'), weightKg: 79 },
      ];
      const result = BodyMeasurementService.computeWeightTrend(points);
      // Для последней точки avg7d считает только 04-14 и 04-15: (80+79)/2 = 79.5
      expect(result[2].avg7d).toBeCloseTo(79.5, 1);
      // avg14d включает все 3: (90+80+79)/3 = 83
      expect(result[2].avg14d).toBeCloseTo(83, 1);
    });

    it('пустой массив → пустой результат', () => {
      expect(BodyMeasurementService.computeWeightTrend([])).toEqual([]);
    });
  });

  describe('getWeightTrend', () => {
    it('фильтрует по диапазону дат и применяет rolling avg', async () => {
      repo.find.mockResolvedValue([
        { measuredAt: new Date('2026-04-10'), weightKg: 80 } as BodyMeasurement,
        { measuredAt: new Date('2026-04-13'), weightKg: 79 } as BodyMeasurement,
      ]);
      const result = await service.getWeightTrend('user-1', 30);
      expect(result).toHaveLength(2);
      expect(result[1].avg7d).toBeCloseTo(79.5, 1);
    });
  });
});
