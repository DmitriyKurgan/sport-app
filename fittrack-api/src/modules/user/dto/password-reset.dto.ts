import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Некорректный email' })
  email!: string;
}

export class ResetPasswordDto {
  // 32 байта → 64 hex символа
  @IsString()
  @Length(64, 64)
  token!: string;

  @IsString()
  @MinLength(8, { message: 'Пароль должен быть не короче 8 символов' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Пароль должен содержать минимум одну заглавную букву и одну цифру',
  })
  newPassword!: string;
}
