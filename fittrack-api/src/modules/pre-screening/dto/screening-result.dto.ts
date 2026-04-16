import { PreScreening } from '../pre-screening.entity';
import { PARQQuestion } from '../constants/parq-questions';

export class ScreeningResultDto {
  id!: string;
  redFlags!: boolean;
  redFlagReasons!: string[];
  recommendation!: string;
  createdAt!: Date;

  static fromEntity(entity: PreScreening): ScreeningResultDto {
    const dto = new ScreeningResultDto();
    dto.id = entity.id;
    dto.redFlags = entity.redFlags;
    dto.redFlagReasons = entity.redFlagReasons;
    dto.recommendation = entity.redFlags
      ? 'Перед началом тренировок настоятельно рекомендуем проконсультироваться с врачом или квалифицированным специалистом. До консультации в приложении будет активен режим низкой интенсивности.'
      : 'Противопоказаний не выявлено. Можно приступать к подбору программы.';
    dto.createdAt = entity.createdAt;
    return dto;
  }
}

export class QuestionsListDto {
  questions!: PARQQuestion[];
}
