import { Test } from '@nestjs/testing';
import { PARQ_QUESTIONS } from '../constants/parq-questions';
import { PreScreeningController } from '../pre-screening.controller';
import { PreScreeningService } from '../pre-screening.service';

describe('PreScreeningController', () => {
  let controller: PreScreeningController;
  let service: jest.Mocked<PreScreeningService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PreScreeningController],
      providers: [
        {
          provide: PreScreeningService,
          useValue: {
            getQuestions: jest.fn(() => PARQ_QUESTIONS),
            submit: jest.fn(),
            findLatest: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(PreScreeningController);
    service = module.get(PreScreeningService);
  });

  it('getQuestions возвращает список', () => {
    const result = controller.getQuestions();
    expect(result.questions).toHaveLength(PARQ_QUESTIONS.length);
  });

  it('submit делегирует в service', async () => {
    await controller.submit('u1', { answers: { q1: false } });
    expect(service.submit).toHaveBeenCalledWith('u1', { answers: { q1: false } });
  });

  it('latest вызывает findLatest', async () => {
    await controller.latest('u1');
    expect(service.findLatest).toHaveBeenCalledWith('u1');
  });
});
