import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingDay } from '../entities';
import { TrainingDayService } from '../services/training-day.service';

describe('TrainingDayService', () => {
  let service: TrainingDayService;
  let repo: jest.Mocked<Repository<TrainingDay>>;

  const mkDay = (overrides: Partial<TrainingDay> = {}) =>
    ({
      id: 'day-1',
      dayNumber: 1,
      name: 'Upper A',
      description: null,
      targetMuscles: [],
      isRestDay: false,
      startedAt: null,
      completedAt: null,
      exercises: [],
      week: {
        program: { userId: 'user-1' },
      },
      ...overrides,
    }) as unknown as TrainingDay;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TrainingDayService,
        {
          provide: getRepositoryToken(TrainingDay),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn((x) => Promise.resolve(x)),
          },
        },
      ],
    }).compile();
    service = module.get(TrainingDayService);
    repo = module.get(getRepositoryToken(TrainingDay));
  });

  describe('findById', () => {
    it('возвращает день если принадлежит юзеру', async () => {
      repo.findOne.mockResolvedValue(mkDay());
      const result = await service.findById('day-1', 'user-1');
      expect(result.id).toBe('day-1');
    });

    it('Forbidden если день чужой', async () => {
      repo.findOne.mockResolvedValue(
        mkDay({ week: { program: { userId: 'other-user' } } } as any),
      );
      await expect(service.findById('day-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('NotFound если день не существует', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById('day-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('startDay', () => {
    it('проставляет startedAt', async () => {
      repo.findOne.mockResolvedValue(mkDay());
      const result = await service.startDay('day-1', 'user-1');
      expect(result.startedAt).not.toBeNull();
    });

    it('BadRequest если уже начата', async () => {
      repo.findOne.mockResolvedValue(mkDay({ startedAt: new Date() }));
      await expect(service.startDay('day-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('BadRequest если завершена', async () => {
      repo.findOne.mockResolvedValue(mkDay({ completedAt: new Date() }));
      await expect(service.startDay('day-1', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeDay', () => {
    it('проставляет completedAt', async () => {
      repo.findOne.mockResolvedValue(mkDay({ startedAt: new Date() }));
      const result = await service.completeDay('day-1', 'user-1');
      expect(result.completedAt).not.toBeNull();
    });

    it('автостарт если ещё не начата', async () => {
      repo.findOne.mockResolvedValue(mkDay());
      const result = await service.completeDay('day-1', 'user-1');
      expect(result.startedAt).not.toBeNull();
      expect(result.completedAt).not.toBeNull();
    });

    it('Forbidden если чужая тренировка', async () => {
      repo.findOne.mockResolvedValue(
        mkDay({ week: { program: { userId: 'other-user' } } } as any),
      );
      await expect(service.completeDay('day-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
