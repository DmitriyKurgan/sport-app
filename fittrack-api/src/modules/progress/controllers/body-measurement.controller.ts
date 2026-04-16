import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../user/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../user/guards/jwt-auth.guard';
import { CreateBodyMeasurementDto } from '../dto/create-body-measurement.dto';
import { WeightTrendQueryDto } from '../dto/query.dto';
import {
  BodyMeasurementResponseDto,
  WeightTrendPointDto,
} from '../dto/response.dto';
import { BodyMeasurementService } from '../services/body-measurement.service';

@UseGuards(JwtAuthGuard)
@Controller('progress/measurements')
export class BodyMeasurementController {
  constructor(private readonly service: BodyMeasurementService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBodyMeasurementDto,
  ): Promise<BodyMeasurementResponseDto> {
    return this.service.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string): Promise<BodyMeasurementResponseDto[]> {
    return this.service.findAll(userId);
  }

  @Get('latest')
  findLatest(@CurrentUser('id') userId: string): Promise<BodyMeasurementResponseDto> {
    return this.service.findLatest(userId);
  }

  @Get('weight-trend')
  getWeightTrend(
    @CurrentUser('id') userId: string,
    @Query() query: WeightTrendQueryDto,
  ): Promise<WeightTrendPointDto[]> {
    return this.service.getWeightTrend(userId, query.days ?? 30);
  }
}
