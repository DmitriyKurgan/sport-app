import { Test } from '@nestjs/testing';
import { AnalyticsController } from '../analytics.controller';
import { AnalyticsService } from '../analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: jest.Mocked<AnalyticsService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: {
            getDashboard: jest.fn(),
            getExerciseProgress: jest.fn(),
            getVolumeLoadAnalytics: jest.fn(),
            getInternalLoadAnalytics: jest.fn(),
            getBodyComposition: jest.fn(),
            getWeeklyReport: jest.fn(),
          },
        },
      ],
    }).compile();
    controller = module.get(AnalyticsController);
    service = module.get(AnalyticsService);
  });

  it('getDashboard', async () => {
    await controller.getDashboard('u1');
    expect(service.getDashboard).toHaveBeenCalledWith('u1');
  });

  it('getExerciseProgress', async () => {
    await controller.getExerciseProgress('u1', 'e1');
    expect(service.getExerciseProgress).toHaveBeenCalledWith('u1', 'e1');
  });

  it('getVolume', async () => {
    await controller.getVolume('u1');
    expect(service.getVolumeLoadAnalytics).toHaveBeenCalled();
  });

  it('getInternalLoad', async () => {
    await controller.getInternalLoad('u1');
    expect(service.getInternalLoadAnalytics).toHaveBeenCalled();
  });

  it('getBody', async () => {
    await controller.getBody('u1');
    expect(service.getBodyComposition).toHaveBeenCalled();
  });

  it('getWeeklyReport', async () => {
    await controller.getWeeklyReport('u1');
    expect(service.getWeeklyReport).toHaveBeenCalled();
  });
});
