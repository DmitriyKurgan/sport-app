import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../user/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../user/guards/jwt-auth.guard';
import { DayResponseDto, ProgramResponseDto, ProgramSummaryDto } from '../dto/program-response.dto';
import { TrainingDayService } from '../services/training-day.service';
import { TrainingProgramService } from '../services/training-program.service';

@UseGuards(JwtAuthGuard)
@Controller('training/programs')
export class TrainingProgramController {
  constructor(
    private readonly programService: TrainingProgramService,
    private readonly dayService: TrainingDayService,
  ) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  generate(@CurrentUser('id') userId: string): Promise<ProgramResponseDto> {
    return this.programService.generate(userId);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string): Promise<ProgramSummaryDto[]> {
    return this.programService.findAll(userId);
  }

  @Get('active')
  findActive(@CurrentUser('id') userId: string): Promise<ProgramResponseDto> {
    return this.programService.findActive(userId);
  }

  @Get(':id')
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ProgramResponseDto> {
    return this.programService.findById(id, userId);
  }

  @Get(':id/weeks/:weekNumber')
  async findWeek(
    @Param('id', ParseUUIDPipe) programId: string,
    @Param('weekNumber', ParseIntPipe) weekNumber: number,
    @CurrentUser('id') userId: string,
  ): Promise<DayResponseDto[]> {
    return this.dayService.findByProgramAndWeek(programId, weekNumber, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.programService.deactivate(id, userId);
  }
}
