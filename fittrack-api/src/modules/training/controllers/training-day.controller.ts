import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../user/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../user/guards/jwt-auth.guard';
import { DayResponseDto } from '../dto/program-response.dto';
import { TrainingDayService } from '../services/training-day.service';

@UseGuards(JwtAuthGuard)
@Controller('training/days')
export class TrainingDayController {
  constructor(private readonly service: TrainingDayService) {}

  @Get(':id')
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<DayResponseDto> {
    return this.service.findById(id, userId);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  start(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<DayResponseDto> {
    return this.service.startDay(id, userId);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<DayResponseDto> {
    return this.service.completeDay(id, userId);
  }
}
