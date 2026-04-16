import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { QuestionsListDto, ScreeningResultDto } from './dto/screening-result.dto';
import { SubmitScreeningDto } from './dto/submit-screening.dto';
import { PreScreeningService } from './pre-screening.service';

@Controller('screening')
export class PreScreeningController {
  constructor(private readonly service: PreScreeningService) {}

  @Get('questions')
  getQuestions(): QuestionsListDto {
    return { questions: [...this.service.getQuestions()] };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  submit(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitScreeningDto,
  ): Promise<ScreeningResultDto> {
    return this.service.submit(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('latest')
  latest(@CurrentUser('id') userId: string): Promise<ScreeningResultDto> {
    return this.service.findLatest(userId);
  }
}
