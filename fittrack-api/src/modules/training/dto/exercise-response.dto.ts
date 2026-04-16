import { Exercise } from '../entities';

export class ExerciseResponseDto {
  id!: string;
  slug!: string;
  name!: string;
  nameRu!: string | null;
  description!: string | null;
  movementPatterns!: string[];
  primaryMuscles!: string[];
  secondaryMuscles!: string[];
  equipmentRequired!: string[];
  equipmentAccessMin!: string;
  difficulty!: number;
  technicalDemand!: string;
  videoUrl!: string | null;
  /**
   * Гарантированно валидный URL поиска YouTube для упражнения.
   * Не угадываем конкретное видео — сервис не зависит от удалённого video ID.
   */
  videoSearchUrl!: string;
  imageUrl!: string | null;

  static fromEntity(ex: Exercise): ExerciseResponseDto {
    const dto = new ExerciseResponseDto();
    dto.id = ex.id;
    dto.slug = ex.slug;
    dto.name = ex.name;
    dto.nameRu = ex.nameRu;
    dto.description = ex.description;
    dto.movementPatterns = ex.movementPatterns;
    dto.primaryMuscles = ex.primaryMuscles;
    dto.secondaryMuscles = ex.secondaryMuscles;
    dto.equipmentRequired = ex.equipmentRequired;
    dto.equipmentAccessMin = ex.equipmentAccessMin;
    dto.difficulty = ex.difficulty;
    dto.technicalDemand = ex.technicalDemand;
    dto.videoUrl = ex.videoUrl;
    dto.videoSearchUrl = buildVideoSearchUrl(ex.nameRu ?? ex.name);
    dto.imageUrl = ex.imageUrl;
    return dto;
  }
}

function buildVideoSearchUrl(name: string): string {
  const query = encodeURIComponent(`${name} правильная техника`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

export class ExerciseCatalogResponseDto {
  exercises!: ExerciseResponseDto[];
  total!: number;
}
