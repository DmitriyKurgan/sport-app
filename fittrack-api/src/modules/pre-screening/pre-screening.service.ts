import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PARQ_QUESTIONS,
  PARQ_QUESTION_IDS,
  PARQQuestion,
} from './constants/parq-questions';
import { ScreeningResultDto } from './dto/screening-result.dto';
import { SubmitScreeningDto } from './dto/submit-screening.dto';
import { ParqAnswers, PreScreening } from './pre-screening.entity';

export interface EvaluationResult {
  redFlags: boolean;
  redFlagReasons: string[];
}

@Injectable()
export class PreScreeningService {
  constructor(
    @InjectRepository(PreScreening)
    private readonly repo: Repository<PreScreening>,
  ) {}

  getQuestions(): readonly PARQQuestion[] {
    return PARQ_QUESTIONS;
  }

  async submit(userId: string, dto: SubmitScreeningDto): Promise<ScreeningResultDto> {
    this.validateAllAnswersPresent(dto.answers);

    const { redFlags, redFlagReasons } = PreScreeningService.evaluateRedFlags(dto.answers);

    const screening = this.repo.create({
      userId,
      answers: dto.answers,
      redFlags,
      redFlagReasons,
    });
    await this.repo.save(screening);

    return ScreeningResultDto.fromEntity(screening);
  }

  async findLatest(userId: string): Promise<ScreeningResultDto> {
    const latest = await this.repo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    if (!latest) {
      throw new NotFoundException('Скрининг ещё не пройден');
    }
    return ScreeningResultDto.fromEntity(latest);
  }

  /**
   * Чистая функция: по ответам возвращает решение.
   * Вынесена как static, чтобы её можно было тестировать без DI
   * и переиспользовать (например, при миграции данных).
   */
  static evaluateRedFlags(answers: ParqAnswers): EvaluationResult {
    const reasons: string[] = [];
    for (const question of PARQ_QUESTIONS) {
      if (answers[question.id] === true && question.redFlagIfYes) {
        reasons.push(question.id);
      }
    }
    return { redFlags: reasons.length > 0, redFlagReasons: reasons };
  }

  private validateAllAnswersPresent(answers: ParqAnswers): void {
    const missing = PARQ_QUESTION_IDS.filter((id) => !(id in answers));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Отсутствуют ответы на вопросы: ${missing.join(', ')}`,
      );
    }
    const extra = Object.keys(answers).filter((id) => !PARQ_QUESTION_IDS.includes(id));
    if (extra.length > 0) {
      throw new BadRequestException(`Неизвестные вопросы: ${extra.join(', ')}`);
    }
  }
}
