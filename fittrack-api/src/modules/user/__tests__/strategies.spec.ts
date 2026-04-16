import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { RefreshTokenStrategy } from '../strategies/refresh-token.strategy';
import { UserService } from '../user.service';

const config = {
  get: jest.fn((key: string) =>
    key === 'jwt.accessSecret' ? 'access-s' : 'refresh-s',
  ),
} as unknown as ConfigService;

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userService: jest.Mocked<UserService>;

  beforeEach(() => {
    userService = {
      findById: jest.fn(),
    } as any;
    strategy = new JwtStrategy(config, userService);
  });

  it('validate возвращает active user', async () => {
    userService.findById.mockResolvedValue({ id: 'u1', isActive: true } as any);
    const user = await strategy.validate({ sub: 'u1', email: 'a@b.c' });
    expect(user.id).toBe('u1');
  });

  it('validate бросает Unauthorized если user inactive', async () => {
    userService.findById.mockResolvedValue({ id: 'u1', isActive: false } as any);
    await expect(strategy.validate({ sub: 'u1', email: 'a@b.c' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('validate бросает Unauthorized если user не найден', async () => {
    userService.findById.mockResolvedValue(null as any);
    await expect(strategy.validate({ sub: 'u1', email: 'a@b.c' })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});

describe('RefreshTokenStrategy', () => {
  let strategy: RefreshTokenStrategy;

  beforeEach(() => {
    strategy = new RefreshTokenStrategy(config);
  });

  it('validate извлекает refreshToken из Authorization header', () => {
    const req = { get: jest.fn().mockReturnValue('Bearer abc.def.ghi') } as any;
    const result = strategy.validate(req, { sub: 'u1', email: 'a@b.c' });
    expect(result.refreshToken).toBe('abc.def.ghi');
  });

  it('validate бросает Unauthorized если header пуст', () => {
    const req = { get: jest.fn().mockReturnValue('') } as any;
    expect(() => strategy.validate(req, { sub: 'u1', email: 'a@b.c' })).toThrow(
      UnauthorizedException,
    );
  });
});
