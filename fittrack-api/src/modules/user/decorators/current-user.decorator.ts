import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { User } from '../user.entity';

/**
 * Извлекает текущего пользователя из request, установленного JwtAuthGuard.
 * Опциональный аргумент — имя поля User, если нужно только его (например, 'id').
 *
 * Использование:
 *   @CurrentUser() user: User
 *   @CurrentUser('id') userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User;
    return data ? user?.[data] : user;
  },
);
