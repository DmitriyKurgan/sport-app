import { Test } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { User } from '../user.entity';

describe('UserController', () => {
  let controller: UserController;
  let service: jest.Mocked<UserService>;

  const mockUser: User = {
    id: 'u1',
    email: 'a@b.c',
    firstName: 'A',
    lastName: 'B',
    createdAt: new Date(),
  } as User;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refreshTokens: jest.fn(),
            logout: jest.fn(),
            update: jest.fn(),
            deleteAccount: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(UserController);
    service = module.get(UserService);
  });

  it('register делегирует в service', async () => {
    await controller.register({ email: 'a@b.c', password: 'P1', firstName: 'A', lastName: 'B' });
    expect(service.register).toHaveBeenCalled();
  });

  it('login делегирует', async () => {
    await controller.login({ email: 'a@b.c', password: 'P1' });
    expect(service.login).toHaveBeenCalled();
  });

  it('logout вызывает service с userId', async () => {
    await controller.logout('u1');
    expect(service.logout).toHaveBeenCalledWith('u1');
  });

  it('me возвращает UserResponseDto', () => {
    const dto = controller.me(mockUser);
    expect(dto.id).toBe('u1');
    expect((dto as any).passwordHash).toBeUndefined();
  });

  it('update вызывает service.update', async () => {
    await controller.update('u1', { firstName: 'New' });
    expect(service.update).toHaveBeenCalledWith('u1', { firstName: 'New' });
  });

  it('deleteAccount вызывает softDelete', async () => {
    await controller.deleteAccount('u1');
    expect(service.deleteAccount).toHaveBeenCalledWith('u1');
  });
});
