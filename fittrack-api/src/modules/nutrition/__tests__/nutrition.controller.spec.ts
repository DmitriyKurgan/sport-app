import { Test } from '@nestjs/testing';
import { NutritionController } from '../nutrition.controller';
import { NutritionService } from '../nutrition.service';

describe('NutritionController', () => {
  let controller: NutritionController;
  let service: jest.Mocked<NutritionService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [NutritionController],
      providers: [
        {
          provide: NutritionService,
          useValue: {
            generatePlan: jest.fn(),
            recalibrate: jest.fn(),
            findActivePlan: jest.fn(),
            updatePlan: jest.fn(),
            getMealsByDay: jest.fn(),
          },
        },
      ],
    }).compile();
    controller = module.get(NutritionController);
    service = module.get(NutritionService);
  });

  it('generate', async () => {
    await controller.generate('u1');
    expect(service.generatePlan).toHaveBeenCalledWith('u1');
  });

  it('recalibrate', async () => {
    await controller.recalibrate('u1', { trendDeltaKg: -0.3 });
    expect(service.recalibrate).toHaveBeenCalledWith('u1', -0.3);
  });

  it('getPlan', async () => {
    await controller.getPlan('u1');
    expect(service.findActivePlan).toHaveBeenCalled();
  });

  it('updatePlan', async () => {
    await controller.updatePlan('p1', 'u1', { tier: 'advanced' as any });
    expect(service.updatePlan).toHaveBeenCalled();
  });

  it('getMeals с дефолтом training_day', async () => {
    await controller.getMeals('p1', 'u1', {});
    expect(service.getMealsByDay).toHaveBeenCalledWith('p1', 'u1', 'training_day');
  });
});
