import { User } from '../user.entity';

export class UserResponseDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  createdAt!: Date;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.createdAt = user.createdAt;
    return dto;
  }
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

export class AuthResponseDto {
  user!: UserResponseDto;
  accessToken!: string;
  refreshToken!: string;
}
