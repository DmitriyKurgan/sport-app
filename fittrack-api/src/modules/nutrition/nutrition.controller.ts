import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { MealsQueryDto } from './dto/meals-query.dto';
import { NutritionPlanResponseDto, PlannedMealDto } from './dto/response.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { NutritionService } from './nutrition.service';

@UseGuards(JwtAuthGuard)
@Controller('nutrition')
export class NutritionController {
  constructor(private readonly service: NutritionService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  generate(@CurrentUser('id') userId: string): Promise<NutritionPlanResponseDto> {
    return this.service.generatePlan(userId);
  }

  /**
   * Пересчитать план по тренду веса (запрашивается фронтом или Bull job).
   * Body: { trendDeltaKg: число; >0 рост, <0 падение }
   */
  @Post('recalibrate')
  @HttpCode(HttpStatus.OK)
  recalibrate(
    @CurrentUser('id') userId: string,
    @Body() body: { trendDeltaKg: number },
  ): Promise<NutritionPlanResponseDto> {
    return this.service.recalibrate(userId, body.trendDeltaKg);
  }

  @Get('plan')
  getPlan(@CurrentUser('id') userId: string): Promise<NutritionPlanResponseDto> {
    return this.service.findActivePlan(userId);
  }

  @Patch('plan/:id')
  updatePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePlanDto,
  ): Promise<NutritionPlanResponseDto> {
    return this.service.updatePlan(id, userId, dto);
  }

  @Get('plan/:id/meals')
  getMeals(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Query() query: MealsQueryDto,
  ): Promise<PlannedMealDto[]> {
    return this.service.getMealsByDay(id, userId, query.dayType ?? 'training_day');
  }
}
