import { Test } from '@nestjs/testing';
import { AlertsController } from '../alerts.controller';
import { AlertsService } from '../alerts.service';

describe('AlertsController', () => {
  let controller: AlertsController;
  let service: jest.Mocked<AlertsService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AlertsController],
      providers: [
        {
          provide: AlertsService,
          useValue: {
            getActive: jest.fn(),
            dismiss: jest.fn(),
            actOn: jest.fn(),
            runAllDetectors: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();
    controller = module.get(AlertsController);
    service = module.get(AlertsService);
  });

  it('getActive', async () => {
    await controller.getActive('u1');
    expect(service.getActive).toHaveBeenCalledWith('u1');
  });

  it('dismiss', async () => {
    await controller.dismiss('a1', 'u1');
    expect(service.dismiss).toHaveBeenCalledWith('a1', 'u1');
  });

  it('actOn', async () => {
    await controller.actOn('a1', 'u1');
    expect(service.actOn).toHaveBeenCalledWith('a1', 'u1');
  });

  it('runDetectors возвращает {created}', async () => {
    const result = await controller.runDetectors('u1');
    expect(result).toEqual({ created: [] });
  });
});
