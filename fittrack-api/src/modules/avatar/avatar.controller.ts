import { Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { AvatarService } from './avatar.service';
import { AvatarResponseDto, AvatarTransformationDto } from './dto/avatar-response.dto';
import { TransformationQueryDto } from './dto/transformation-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('avatar')
export class AvatarController {
  constructor(private readonly service: AvatarService) {}

  @Get()
  getCurrent(@CurrentUser('id') userId: string): Promise<AvatarResponseDto> {
    return this.service.getCurrent(userId);
  }

  @Get('transformation')
  getTransformation(
    @CurrentUser('id') userId: string,
    @Query() query: TransformationQueryDto,
  ): Promise<AvatarTransformationDto> {
    return this.service.getTransformation(userId, query.from, query.to);
  }

  @Post('recalculate')
  @HttpCode(HttpStatus.OK)
  recalculate(@CurrentUser('id') userId: string): Promise<AvatarResponseDto> {
    return this.service.recalculate(userId);
  }
}
