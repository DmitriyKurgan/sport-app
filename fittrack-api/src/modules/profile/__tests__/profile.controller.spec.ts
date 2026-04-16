import { Test } from '@nestjs/testing';
import { ProfileController } from '../profile.controller';
import { ProfileService } from '../profile.service';

describe('ProfileController', () => {
  let controller: ProfileController;
  let service: jest.Mocked<ProfileService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: {
            create: jest.fn(),
            findByUserId: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();
    controller = module.get(ProfileController);
    service = module.get(ProfileService);
  });

  it('create вызывает service', async () => {
    const dto = { sex: 'male' } as any;
    await controller.create('u1', dto);
    expect(service.create).toHaveBeenCalledWith('u1', dto);
  });

  it('findMine вызывает findByUserId', async () => {
    await controller.findMine('u1');
    expect(service.findByUserId).toHaveBeenCalledWith('u1');
  });

  it('update вызывает service', async () => {
    await controller.update('u1', { weightKg: 80 });
    expect(service.update).toHaveBeenCalledWith('u1', { weightKg: 80 });
  });
});
