import { Test } from '@nestjs/testing';
import { BodyMeasurementController } from '../controllers/body-measurement.controller';
import { ProgressController } from '../controllers/progress.controller';
import { BodyMeasurementService } from '../services/body-measurement.service';
import { ProgressLogService } from '../services/progress-log.service';

describe('ProgressController', () => {
  let controller: ProgressController;
  let service: jest.Mocked<ProgressLogService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProgressController],
      providers: [
        {
          provide: ProgressLogService,
          useValue: {
            logSet: jest.fn(),
            logSessionRPE: jest.fn(),
            getByDateRange: jest.fn(),
            getByExercise: jest.fn(),
            getPersonalRecords: jest.fn(),
            getVolumeLoadByWeek: jest.fn(),
            getInternalLoadByWeek: jest.fn(),
          },
        },
      ],
    }).compile();
    controller = module.get(ProgressController);
    service = module.get(ProgressLogService);
  });

  it('logSet', async () => {
    const dto = { exerciseId: 'e1', setNumber: 1, weightKg: 80, reps: 10 };
    await controller.logSet('u1', dto);
    expect(service.logSet).toHaveBeenCalledWith('u1', dto);
  });

  it('logSessionRPE', async () => {
    await controller.logSessionRPE('u1', { trainingDayId: 'd1', sessionRpe: 7, durationMinutes: 60 });
    expect(service.logSessionRPE).toHaveBeenCalled();
  });

  it('getLogs', async () => {
    await controller.getLogs('u1', { page: 1, limit: 50 });
    expect(service.getByDateRange).toHaveBeenCalled();
  });

  it('getByExercise', async () => {
    await controller.getByExercise('u1', 'e1');
    expect(service.getByExercise).toHaveBeenCalledWith('u1', 'e1');
  });

  it('getRecords', async () => {
    await controller.getRecords('u1');
    expect(service.getPersonalRecords).toHaveBeenCalled();
  });

  it('getVolumeLoad', async () => {
    await controller.getVolumeLoad('u1');
    expect(service.getVolumeLoadByWeek).toHaveBeenCalledWith('u1');
  });

  it('getInternalLoad', async () => {
    await controller.getInternalLoad('u1');
    expect(service.getInternalLoadByWeek).toHaveBeenCalledWith('u1');
  });
});

describe('BodyMeasurementController', () => {
  let controller: BodyMeasurementController;
  let service: jest.Mocked<BodyMeasurementService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [BodyMeasurementController],
      providers: [
        {
          provide: BodyMeasurementService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findLatest: jest.fn(),
            getWeightTrend: jest.fn(),
          },
        },
      ],
    }).compile();
    controller = module.get(BodyMeasurementController);
    service = module.get(BodyMeasurementService);
  });

  it('create', async () => {
    await controller.create('u1', { weightKg: 80 });
    expect(service.create).toHaveBeenCalled();
  });

  it('findAll', async () => {
    await controller.findAll('u1');
    expect(service.findAll).toHaveBeenCalled();
  });

  it('findLatest', async () => {
    await controller.findLatest('u1');
    expect(service.findLatest).toHaveBeenCalled();
  });

  it('getWeightTrend с дефолтом 30', async () => {
    await controller.getWeightTrend('u1', {});
    expect(service.getWeightTrend).toHaveBeenCalledWith('u1', 30);
  });

  it('getWeightTrend с переданным days', async () => {
    await controller.getWeightTrend('u1', { days: 90 });
    expect(service.getWeightTrend).toHaveBeenCalledWith('u1', 90);
  });
});
