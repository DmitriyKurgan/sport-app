import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../user/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../user/guards/jwt-auth.guard';
import { CreateProgressLogDto } from '../dto/create-progress-log.dto';
import { LogSessionRPEDto } from '../dto/log-session-rpe.dto';
import { ProgressLogsQueryDto } from '../dto/query.dto';
import {
  PersonalRecordDto,
  ProgressLogResponseDto,
  SessionRPEResponseDto,
  WeeklyAggregateDto,
} from '../dto/response.dto';
import { ProgressLogService } from '../services/progress-log.service';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response.interface';

@UseGuards(JwtAuthGuard)
@Controller('progress')
export class ProgressController {
  constructor(private readonly service: ProgressLogService) {}

  @Post('log')
  @HttpCode(HttpStatus.CREATED)
  logSet(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProgressLogDto,
  ): Promise<ProgressLogResponseDto> {
    return this.service.logSet(userId, dto);
  }

  @Post('session-rpe')
  @HttpCode(HttpStatus.CREATED)
  logSessionRPE(
    @CurrentUser('id') userId: string,
    @Body() dto: LogSessionRPEDto,
  ): Promise<SessionRPEResponseDto> {
    return this.service.logSessionRPE(userId, dto);
  }

  @Get('logs')
  getLogs(
    @CurrentUser('id') userId: string,
    @Query() query: ProgressLogsQueryDto,
  ): Promise<PaginatedResponse<ProgressLogResponseDto>> {
    return this.service.getByDateRange(userId, query);
  }

  @Get('logs/exercise/:exerciseId')
  getByExercise(
    @CurrentUser('id') userId: string,
    @Param('exerciseId', ParseUUIDPipe) exerciseId: string,
  ): Promise<ProgressLogResponseDto[]> {
    return this.service.getByExercise(userId, exerciseId);
  }

  @Get('records')
  getRecords(@CurrentUser('id') userId: string): Promise<PersonalRecordDto[]> {
    return this.service.getPersonalRecords(userId);
  }

  @Get('volume-load')
  getVolumeLoad(@CurrentUser('id') userId: string): Promise<WeeklyAggregateDto[]> {
    return this.service.getVolumeLoadByWeek(userId);
  }

  @Get('internal-load')
  getInternalLoad(@CurrentUser('id') userId: string): Promise<WeeklyAggregateDto[]> {
    return this.service.getInternalLoadByWeek(userId);
  }
}
