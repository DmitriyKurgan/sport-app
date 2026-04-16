import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../user/guards/jwt-auth.guard';
import { CatalogQueryDto } from '../dto/catalog-query.dto';
import { ExerciseCatalogResponseDto, ExerciseResponseDto } from '../dto/exercise-response.dto';
import { ExerciseService } from '../services/exercise.service';

@UseGuards(JwtAuthGuard)
@Controller('training/catalog')
export class ExerciseController {
  constructor(private readonly service: ExerciseService) {}

  @Get()
  async getCatalog(@Query() query: CatalogQueryDto): Promise<ExerciseCatalogResponseDto> {
    const { items, total } = await this.service.findCatalog(query);
    return {
      exercises: items.map(ExerciseResponseDto.fromEntity),
      total,
    };
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string): Promise<ExerciseResponseDto> {
    const exercise = await this.service.findBySlug(slug);
    return ExerciseResponseDto.fromEntity(exercise);
  }
}
