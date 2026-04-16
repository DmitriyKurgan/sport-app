import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PARQ_QUESTION_IDS } from '../constants/parq-questions';
import { PreScreening } from '../pre-screening.entity';
import { PreScreeningService } from '../pre-screening.service';

describe('PreScreeningService', () => {
  let service: PreScreeningService;
  let repo: jest.Mocked<Repository<PreScreening>>;

  const allNo = () =>
    Object.fromEntries(PARQ_QUESTION_IDS.map((id) => [id, false])) as Record<string, boolean>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PreScreeningService,
        {
          provide: getRepositoryToken(PreScreening),
          useValue: {
            create: jest.fn((x) => x),
            save: jest.fn((x) => Promise.resolve({ ...x, id: 'uuid-1', createdAt: new Date() })),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();
    service = module.get(PreScreeningService);
    repo = module.get(getRepositoryToken(PreScreening));
  });

  describe('evaluateRedFlags (pure)', () => {
    it('все NO → нет red flags', () => {
      const result = PreScreeningService.evaluateRedFlags(allNo());
      expect(result.redFlags).toBe(false);
      expect(result.redFlagReasons).toEqual([]);
    });

    it('один YES на критичный вопрос → red flag', () => {
      const answers = { ...allNo(), heart_condition: true };
      const result = PreScreeningService.evaluateRedFlags(answers);
      expect(result.redFlags).toBe(true);
      expect(result.redFlagReasons).toEqual(['heart_condition']);
    });

    it('несколько YES → все причины в списке', () => {
      const answers = {
        ...allNo(),
        heart_condition: true,
        chest_pain_activity: true,
        bone_joint: true,
      };
      const result = PreScreeningService.evaluateRedFlags(answers);
      expect(result.redFlags).toBe(true);
      expect(result.redFlagReasons).toEqual(
        expect.arrayContaining(['heart_condition', 'chest_pain_activity', 'bone_joint']),
      );
      expect(result.redFlagReasons).toHaveLength(3);
    });

    it('pregnant=YES — не red flag (requiresClarification)', () => {
      const answers = { ...allNo(), pregnant: true };
      const result = PreScreeningService.evaluateRedFlags(answers);
      expect(result.redFlags).toBe(false);
      expect(result.redFlagReasons).toEqual([]);
    });
  });

  describe('submit', () => {
    it('сохраняет ответы и возвращает ScreeningResultDto', async () => {
      const result = await service.submit('user-1', { answers: allNo() });
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', redFlags: false, redFlagReasons: [] }),
      );
      expect(result.redFlags).toBe(false);
      expect(result.recommendation).toMatch(/Противопоказаний не выявлено/);
    });

    it('при red flags возвращает рекомендацию про врача', async () => {
      const answers = { ...allNo(), heart_condition: true };
      const result = await service.submit('user-1', { answers });
      expect(result.redFlags).toBe(true);
      expect(result.recommendation).toMatch(/проконсультироваться с врачом/);
    });

    it('BadRequest если отсутствует вопрос', async () => {
      const answers = allNo();
      delete answers.heart_condition;
      await expect(service.submit('user-1', { answers })).rejects.toThrow(BadRequestException);
    });

    it('BadRequest если передан неизвестный вопрос', async () => {
      const answers = { ...allNo(), fake_question: true } as Record<string, boolean>;
      await expect(service.submit('user-1', { answers })).rejects.toThrow(BadRequestException);
    });
  });

  describe('findLatest', () => {
    it('возвращает последний скрининг', async () => {
      repo.findOne.mockResolvedValue({
        id: 'uuid-1',
        userId: 'user-1',
        answers: allNo(),
        redFlags: false,
        redFlagReasons: [],
        createdAt: new Date(),
      } as PreScreening);
      const result = await service.findLatest('user-1');
      expect(result.id).toBe('uuid-1');
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
      });
    });

    it('NotFound, если нет скринингов', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findLatest('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getQuestions', () => {
    it('возвращает все 8 вопросов', () => {
      const questions = service.getQuestions();
      expect(questions).toHaveLength(8);
      expect(questions.map((q) => q.id)).toEqual(PARQ_QUESTION_IDS);
    });
  });
});
