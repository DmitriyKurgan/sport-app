import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { IsNull, LessThan, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthResponseDto, AuthTokensDto, UserResponseDto } from './dto/user-response.dto';
import { MailService } from '../mail/mail.service';
import { MetricsService } from '../metrics';
import { PasswordResetToken } from './password-reset-token.entity';
import { JwtPayload } from './strategies/jwt.strategy';
import { User } from './user.entity';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 минут

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private readonly resetRepo: Repository<PasswordResetToken>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly metrics: MetricsService,
    private readonly mail: MailService,
  ) {}

  async register(dto: CreateUserDto): Promise<AuthResponseDto> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email, deletedAt: IsNull() },
    });
    if (existing) {
      this.metrics.authAttempts.inc({ endpoint: 'register', result: 'conflict' });
      throw new ConflictException('Email уже зарегистрирован');
    }

    const rounds = this.config.get<number>('app.bcryptRounds', 10);
    const passwordHash = await bcrypt.hash(dto.password, rounds);

    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    await this.userRepo.save(user);

    const tokens = await this.issueTokens(user);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    this.metrics.authAttempts.inc({ endpoint: 'register', result: 'success' });
    return {
      user: UserResponseDto.fromEntity(user),
      ...tokens,
    };
  }

  async login(dto: LoginUserDto): Promise<AuthResponseDto> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email, deletedAt: IsNull() },
    });
    if (!user) {
      this.metrics.authAttempts.inc({ endpoint: 'login', result: 'invalid_credentials' });
      throw new UnauthorizedException('Неверный email или пароль');
    }

    if (!user.isActive) {
      this.metrics.authAttempts.inc({ endpoint: 'login', result: 'inactive' });
      throw new ForbiddenException('Аккаунт деактивирован');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      this.metrics.authAttempts.inc({ endpoint: 'login', result: 'invalid_credentials' });
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const tokens = await this.issueTokens(user);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    this.metrics.authAttempts.inc({ endpoint: 'login', result: 'success' });
    return {
      user: UserResponseDto.fromEntity(user),
      ...tokens,
    };
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<AuthTokensDto> {
    const user = await this.userRepo.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!user || !user.refreshTokenHash) {
      throw new ForbiddenException('Refresh token отозван');
    }

    const tokenValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!tokenValid) throw new ForbiddenException('Refresh token недействителен');

    const tokens = await this.issueTokens(user);
    await this.persistRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.userRepo.update({ id: userId }, { refreshTokenHash: null });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id, deletedAt: IsNull() } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  async update(userId: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findById(userId);

    if (dto.email && dto.email !== user.email) {
      const exists = await this.userRepo.findOne({
        where: { email: dto.email, deletedAt: IsNull() },
      });
      if (exists) throw new ConflictException('Email уже используется');
      user.email = dto.email;
    }
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;

    await this.userRepo.save(user);
    return UserResponseDto.fromEntity(user);
  }

  async deleteAccount(userId: string): Promise<void> {
    // soft delete через TypeORM DeleteDateColumn
    await this.userRepo.softDelete({ id: userId });
    await this.userRepo.update({ id: userId }, { refreshTokenHash: null, isActive: false });
  }

  // === password reset ===

  /**
   * Создаёт single-use токен и шлёт email со ссылкой.
   * НЕ раскрывает наличие email — всегда выполняется без ошибки (200).
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { email, deletedAt: IsNull(), isActive: true },
    });

    // Не раскрываем существование email — но если пользователь есть,
    // создаём токен и шлём письмо.
    if (!user) return;

    // Чистим устаревшие/использованные токены этого пользователя
    await this.resetRepo.delete({ userId: user.id });

    const rawToken = randomBytes(32).toString('hex'); // 64 hex char
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    await this.resetRepo.save(
      this.resetRepo.create({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      }),
    );

    await this.mail.sendPasswordReset(user.email, rawToken);
  }

  /**
   * Применяет reset: проверяет токен, ставит новый пароль, инвалидирует все refresh-токены.
   */
  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const record = await this.resetRepo.findOne({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Ссылка для сброса недействительна или истекла');
    }

    const user = await this.userRepo.findOne({
      where: { id: record.userId, deletedAt: IsNull(), isActive: true },
    });
    if (!user) {
      throw new UnauthorizedException('Пользователь недоступен');
    }

    const rounds = this.config.get<number>('app.bcryptRounds', 10);
    const passwordHash = await bcrypt.hash(newPassword, rounds);

    await this.userRepo.update(
      { id: user.id },
      // Ставим новый пароль и зануляем refresh-токен — все существующие сессии разлогинятся.
      { passwordHash, refreshTokenHash: null },
    );

    await this.resetRepo.update({ id: record.id }, { usedAt: new Date() });
    // На всякий случай — удалим заодно все просроченные токены этого юзера.
    await this.resetRepo.delete({ userId: user.id, expiresAt: LessThan(new Date()) });
  }

  // === private helpers ===

  private async issueTokens(user: User): Promise<AuthTokensDto> {
    const payload: JwtPayload = { sub: user.id, email: user.email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessExpiry'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpiry'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async persistRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const rounds = this.config.get<number>('app.bcryptRounds', 10);
    const hash = await bcrypt.hash(refreshToken, rounds);
    await this.userRepo.update({ id: userId }, { refreshTokenHash: hash });
  }
}
