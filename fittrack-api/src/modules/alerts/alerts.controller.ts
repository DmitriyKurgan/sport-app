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
import { CurrentUser } from '../user/decorators/current-user.decorator';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { AlertsService } from './alerts.service';
import { ActOnResultDto, AlertResponseDto } from './dto/alert-response.dto';

@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly service: AlertsService) {}

  @Get()
  getActive(@CurrentUser('id') userId: string): Promise<AlertResponseDto[]> {
    return this.service.getActive(userId);
  }

  @Post(':id/dismiss')
  @HttpCode(HttpStatus.OK)
  dismiss(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<AlertResponseDto> {
    return this.service.dismiss(id, userId);
  }

  @Post(':id/act')
  @HttpCode(HttpStatus.OK)
  actOn(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ActOnResultDto> {
    return this.service.actOn(id, userId);
  }

  /** Принудительный запуск детекторов (debug + Bull job entrypoint). */
  @Post('run-detectors')
  @HttpCode(HttpStatus.OK)
  async runDetectors(@CurrentUser('id') userId: string) {
    const created = await this.service.runAllDetectors(userId);
    return { created };
  }
}
