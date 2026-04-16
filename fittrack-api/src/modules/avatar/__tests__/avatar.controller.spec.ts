import { Test } from '@nestjs/testing';
import { AvatarController } from '../avatar.controller';
import { AvatarService } from '../avatar.service';

describe('AvatarController', () => {
  let controller: AvatarController;
  let service: jest.Mocked<AvatarService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AvatarController],
      providers: [
        {
          provide: AvatarService,
          useValue: {
            getCurrent: jest.fn(),
            getTransformation: jest.fn(),
            recalculate: jest.fn(),
          },
        },
      ],
    }).compile();
    controller = module.get(AvatarController);
    service = module.get(AvatarService);
  });

  it('getCurrent', async () => {
    await controller.getCurrent('u1');
    expect(service.getCurrent).toHaveBeenCalledWith('u1');
  });

  it('getTransformation передаёт даты', async () => {
    const from = new Date('2026-01-01');
    const to = new Date('2026-04-01');
    await controller.getTransformation('u1', { from, to });
    expect(service.getTransformation).toHaveBeenCalledWith('u1', from, to);
  });

  it('recalculate', async () => {
    await controller.recalculate('u1');
    expect(service.recalculate).toHaveBeenCalledWith('u1');
  });
});
