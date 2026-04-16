import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import {
  BodyCompositionPoint,
  ChartDataPoint,
  DashboardResponse,
  ExerciseProgressPoint,
  WeeklyReport,
} from './interfaces';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser('id') userId: string): Promise<DashboardResponse> {
    return this.service.getDashboard(userId);
  }

  @Get('exercise/:exerciseId')
  getExerciseProgress(
    @CurrentUser('id') userId: string,
    @Param('exerciseId', ParseUUIDPipe) exerciseId: string,
  ): Promise<ExerciseProgressPoint[]> {
    return this.service.getExerciseProgress(userId, exerciseId);
  }

  @Get('volume')
  getVolume(@CurrentUser('id') userId: string): Promise<ChartDataPoint[]> {
    return this.service.getVolumeLoadAnalytics(userId);
  }

  @Get('internal-load')
  getInternalLoad(@CurrentUser('id') userId: string): Promise<ChartDataPoint[]> {
    return this.service.getInternalLoadAnalytics(userId);
  }

  @Get('body')
  getBody(@CurrentUser('id') userId: string): Promise<BodyCompositionPoint[]> {
    return this.service.getBodyComposition(userId);
  }

  @Get('report/weekly')
  getWeeklyReport(@CurrentUser('id') userId: string): Promise<WeeklyReport> {
    return this.service.getWeeklyReport(userId);
  }
}
