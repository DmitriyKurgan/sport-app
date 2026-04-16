import { Test } from '@nestjs/testing';
import { ExerciseController } from '../controllers/exercise.controller';
import { TrainingDayController } from '../controllers/training-day.controller';
import { TrainingProgramController } from '../controllers/training-program.controller';
import { ExerciseService } from '../services/exercise.service';
import { TrainingDayService } from '../services/training-day.service';
import { TrainingProgramService } from '../services/training-program.service';

describe('TrainingProgramController', () => {
  let controller: TrainingProgramController;
  let programService: jest.Mocked<TrainingProgramService>;
  let dayService: jest.Mocked<TrainingDayService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TrainingProgramController],
      providers: [
        {
          provide: TrainingProgramService,
          useValue: {
            generate: jest.fn(),
            findAll: jest.fn(),
            findActive: jest.fn(),
            findById: jest.fn(),
            deactivate: jest.fn(),
          },
        },
        {
          provide: TrainingDayService,
          useValue: { findByProgramAndWeek: jest.fn().mockResolvedValue([]) },
        },
      ],
    }).compile();
    controller = module.get(TrainingProgramController);
    programService = module.get(TrainingProgramService);
    dayService = module.get(TrainingDayService);
  });

  it('generate', async () => {
    await controller.generate('u1');
    expect(programService.generate).toHaveBeenCalledWith('u1');
  });

  it('findAll', async () => {
    await controller.findAll('u1');
    expect(programService.findAll).toHaveBeenCalled();
  });

  it('findActive', async () => {
    await controller.findActive('u1');
    expect(programService.findActive).toHaveBeenCalled();
  });

  it('findById', async () => {
    await controller.findById('p1', 'u1');
    expect(programService.findById).toHaveBeenCalledWith('p1', 'u1');
  });

  it('findWeek делегирует в dayService', async () => {
    await controller.findWeek('p1', 3, 'u1');
    expect(dayService.findByProgramAndWeek).toHaveBeenCalledWith('p1', 3, 'u1');
  });

  it('deactivate', async () => {
    await controller.deactivate('p1', 'u1');
    expect(programService.deactivate).toHaveBeenCalledWith('p1', 'u1');
  });
});

describe('TrainingDayController', () => {
  let controller: TrainingDayController;
  let service: jest.Mocked<TrainingDayService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TrainingDayController],
      providers: [
        {
          provide: TrainingDayService,
          useValue: {
            findById: jest.fn(),
            startDay: jest.fn(),
            completeDay: jest.fn(),
          },
        },
      ],
    }).compile();
    controller = module.get(TrainingDayController);
    service = module.get(TrainingDayService);
  });

  it('findById', async () => {
    await controller.findById('d1', 'u1');
    expect(service.findById).toHaveBeenCalledWith('d1', 'u1');
  });

  it('start', async () => {
    await controller.start('d1', 'u1');
    expect(service.startDay).toHaveBeenCalledWith('d1', 'u1');
  });

  it('complete', async () => {
    await controller.complete('d1', 'u1');
    expect(service.completeDay).toHaveBeenCalledWith('d1', 'u1');
  });
});

describe('ExerciseController', () => {
  let controller: ExerciseController;
  let service: jest.Mocked<ExerciseService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ExerciseController],
      providers: [
        {
          provide: ExerciseService,
          useValue: {
            findCatalog: jest.fn().mockResolvedValue({ items: [], total: 0 }),
            findBySlug: jest.fn(),
          },
        },
      ],
    }).compile();
    controller = module.get(ExerciseController);
    service = module.get(ExerciseService);
  });

  it('getCatalog возвращает обёрнутый response', async () => {
    const result = await controller.getCatalog({});
    expect(result.exercises).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('getBySlug', async () => {
    service.findBySlug.mockResolvedValue({
      id: 'e1',
      slug: 'pushup',
      name: 'Push-up',
      nameRu: null,
      description: null,
      movementPatterns: [],
      primaryMuscles: [],
      secondaryMuscles: [],
      equipmentRequired: [],
      equipmentAccessMin: 'bodyweight',
      difficulty: 1,
      technicalDemand: 'low',
      videoUrl: null,
      imageUrl: null,
    } as any);
    await controller.getBySlug('pushup');
    expect(service.findBySlug).toHaveBeenCalledWith('pushup');
  });
});
