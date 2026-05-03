import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from './decorators/current-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthResponseDto, AuthTokensDto, UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { JwtPayloadWithToken } from './strategies/refresh-token.strategy';
import { User } from './user.entity';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Throttle({ global: { limit: 3, ttl: 60_000 } })
  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: CreateUserDto): Promise<AuthResponseDto> {
    return this.userService.register(dto);
  }

  @Throttle({ global: { limit: 5, ttl: 60_000 } })
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginUserDto): Promise<AuthResponseDto> {
    return this.userService.login(dto);
  }

  @Throttle({ global: { limit: 10, ttl: 60_000 } })
  @UseGuards(RefreshTokenGuard)
  @Post('auth/refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @CurrentUser('id') userId: string,
    // RefreshTokenStrategy кладёт весь payload в req.user; достаём оттуда токен
    @CurrentUser() _user: User,
  ): Promise<AuthTokensDto> {
    // Типы немного расходятся: стратегия возвращает JwtPayloadWithToken, не User.
    // Извлекаем refreshToken напрямую — это ожидаемое поведение.
    const payload = _user as unknown as JwtPayloadWithToken;
    return this.userService.refreshTokens(payload.sub, payload.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('auth/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser('id') userId: string): Promise<void> {
    await this.userService.logout(userId);
  }

  // === password reset ===

  /** Request reset link. Always 200 — не раскрываем существование email. */
  @Throttle({ global: { limit: 3, ttl: 15 * 60_000 } })
  @Post('auth/forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ status: 'ok' }> {
    await this.userService.requestPasswordReset(dto.email);
    return { status: 'ok' };
  }

  /** Apply reset using token from email. */
  @Throttle({ global: { limit: 5, ttl: 15 * 60_000 } })
  @Post('auth/reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ status: 'ok' }> {
    await this.userService.resetPassword(dto.token, dto.newPassword);
    return { status: 'ok' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/me')
  me(@CurrentUser() user: User): UserResponseDto {
    return UserResponseDto.fromEntity(user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('users/me')
  update(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.update(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('users/me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@CurrentUser('id') userId: string): Promise<void> {
    await this.userService.deleteAccount(userId);
  }
}
