import { Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { BodyTypeService } from './body-type.service';
import { BodyTypeHistoryDto, BodyTypeResponseDto } from './dto/body-type-response.dto';

@UseGuards(JwtAuthGuard)
@Controller('body-type')
export class BodyTypeController {
  constructor(private readonly service: BodyTypeService) {}

  @Get()
  getCurrent(@CurrentUser('id') userId: string): Promise<BodyTypeResponseDto> {
    return this.service.getCurrent(userId);
  }

  @Get('history')
  async getHistory(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
  ): Promise<BodyTypeHistoryDto> {
    const parsed = limit ? Math.min(parseInt(limit, 10) || 50, 200) : 50;
    const snapshots = await this.service.getHistory(userId, parsed);
    return { snapshots };
  }

  @Post('recalculate')
  @HttpCode(HttpStatus.OK)
  recalculate(@CurrentUser('id') userId: string): Promise<BodyTypeResponseDto> {
    return this.service.recalculate(userId);
  }
}
