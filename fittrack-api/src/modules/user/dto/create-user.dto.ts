import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Пароль должен быть не короче 8 символов' })
  @MaxLength(100)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Пароль должен содержать минимум одну заглавную букву и одну цифру',
  })
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;
}
