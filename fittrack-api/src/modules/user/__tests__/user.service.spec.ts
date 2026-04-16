import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { MetricsService } from '../../metrics';
import { User } from '../user.entity';
import { UserService } from '../user.service';

const metricsMock = {
  authAttempts: { inc: jest.fn() },
  programsGenerated: { inc: jest.fn() },
  programGenerationDuration: { observe: jest.fn(), startTimer: jest.fn(() => () => 0) },
  progressLogs: { inc: jest.fn() },
  httpRequestDuration: { observe: jest.fn() },
} as unknown as MetricsService;

describe('UserService', () => {
  let service: UserService;
  let repo: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('signed-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: unknown) => {
              const map: Record<string, unknown> = {
                'app.bcryptRounds': 4, // быстрее в тестах
                'jwt.accessSecret': 'access-secret',
                'jwt.refreshSecret': 'refresh-secret',
                'jwt.accessExpiry': '15m',
                'jwt.refreshExpiry': '7d',
              };
              return map[key] ?? def;
            }),
          },
        },
        { provide: MetricsService, useValue: metricsMock },
      ],
    }).compile();

    service = module.get(UserService);
    repo = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  describe('register', () => {
    it('создаёт нового пользователя и возвращает токены', async () => {
      const dto = {
        email: 'user@example.com',
        password: 'Secure123',
        firstName: 'Иван',
        lastName: 'Петров',
      };
      repo.findOne.mockResolvedValueOnce(null); // email свободен
      const created = {
        id: 'uuid-1',
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        createdAt: new Date(),
      } as User;
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);
      repo.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.register(dto);

      expect(result.user.email).toBe(dto.email);
      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      // refresh token хэшируется и сохраняется
      expect(repo.update).toHaveBeenCalledWith(
        { id: 'uuid-1' },
        expect.objectContaining({ refreshTokenHash: expect.any(String) }),
      );
    });

    it('бросает ConflictException, если email занят', async () => {
      repo.findOne.mockResolvedValueOnce({ id: 'existing' } as User);
      await expect(
        service.register({
          email: 'taken@example.com',
          password: 'Secure123',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('возвращает токены при правильном пароле', async () => {
      const passwordHash = await bcrypt.hash('Secure123', 4);
      repo.findOne.mockResolvedValueOnce({
        id: 'uuid-1',
        email: 'user@example.com',
        firstName: 'A',
        lastName: 'B',
        passwordHash,
        isActive: true,
        createdAt: new Date(),
      } as User);
      repo.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.login({
        email: 'user@example.com',
        password: 'Secure123',
      });

      expect(result.accessToken).toBe('signed-token');
    });

    it('бросает UnauthorizedException при неверном пароле', async () => {
      const passwordHash = await bcrypt.hash('correct-pass', 4);
      repo.findOne.mockResolvedValueOnce({
        id: 'uuid-1',
        email: 'user@example.com',
        passwordHash,
        isActive: true,
      } as User);

      await expect(
        service.login({ email: 'user@example.com', password: 'wrong-pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('бросает UnauthorizedException, если пользователь не найден', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      await expect(
        service.login({ email: 'ghost@example.com', password: 'Secure123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('обновляет токены при валидном refresh', async () => {
      const rt = 'incoming-refresh-token';
      const rtHash = await bcrypt.hash(rt, 4);
      repo.findOne.mockResolvedValueOnce({
        id: 'uuid-1',
        email: 'user@example.com',
        refreshTokenHash: rtHash,
      } as User);
      repo.update.mockResolvedValue({ affected: 1 } as any);

      const tokens = await service.refreshTokens('uuid-1', rt);
      expect(tokens.accessToken).toBe('signed-token');
      expect(tokens.refreshToken).toBe('signed-token');
    });
  });

  describe('logout', () => {
    it('обнуляет refresh_token_hash', async () => {
      repo.update.mockResolvedValue({ affected: 1 } as any);
      await service.logout('uuid-1');
      expect(repo.update).toHaveBeenCalledWith(
        { id: 'uuid-1' },
        { refreshTokenHash: null },
      );
    });
  });

  describe('deleteAccount', () => {
    it('выполняет soft-delete и инвалидирует токен', async () => {
      repo.softDelete.mockResolvedValue({ affected: 1 } as any);
      repo.update.mockResolvedValue({ affected: 1 } as any);
      await service.deleteAccount('uuid-1');
      expect(repo.softDelete).toHaveBeenCalledWith({ id: 'uuid-1' });
      expect(repo.update).toHaveBeenCalledWith(
        { id: 'uuid-1' },
        { refreshTokenHash: null, isActive: false },
      );
    });
  });
});
