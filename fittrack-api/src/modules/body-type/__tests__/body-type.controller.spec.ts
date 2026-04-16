import { Test } from '@nestjs/testing';
import { BodyTypeController } from '../body-type.controller';
import { BodyTypeService } from '../body-type.service';

describe('BodyTypeController', () => {
  let controller: BodyTypeController;
  let service: jest.Mocked<BodyTypeService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [BodyTypeController],
      providers: [
        {
          provide: BodyTypeService,
          useValue: {
            getCurrent: jest.fn(),
            getHistory: jest.fn().mockResolvedValue([]),
            recalculate: jest.fn(),
          },
        },
      ],
    }).compile();
    controller = module.get(BodyTypeController);
    service = module.get(BodyTypeService);
  });

  it('getCurrent', async () => {
    await controller.getCurrent('u1');
    expect(service.getCurrent).toHaveBeenCalledWith('u1');
  });

  it('getHistory с лимитом по умолчанию', async () => {
    await controller.getHistory('u1');
    expect(service.getHistory).toHaveBeenCalledWith('u1', 50);
  });

  it('getHistory с переданным limit (max 200)', async () => {
    await controller.getHistory('u1', '500');
    expect(service.getHistory).toHaveBeenCalledWith('u1', 200);
  });

  it('recalculate', async () => {
    await controller.recalculate('u1');
    expect(service.recalculate).toHaveBeenCalledWith('u1');
  });
});
