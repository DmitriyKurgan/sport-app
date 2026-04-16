import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DayResponseDto } from '../dto/program-response.dto';
import { TrainingDay } from '../entities';

@Injectable()
export class TrainingDayService {
  constructor(
    @InjectRepository(TrainingDay)
    private readonly repo: Repository<TrainingDay>,
  ) {}

  async findById(id: string, userId: string): Promise<DayResponseDto> {
    const day = await this.loadDayWithOwnership(id, userId);
    return DayResponseDto.fromEntity(day);
  }

  async findByProgramAndWeek(
    programId: string,
    weekNumber: number,
    userId: string,
  ): Promise<DayResponseDto[]> {
    const days = await this.repo.find({
      where: {
        week: { weekNumber, program: { id: programId, userId } },
      },
      relations: {
        week: { program: true },
        exercises: { exercise: true },
      },
      order: { dayNumber: 'ASC' },
    });
    return days.map(DayResponseDto.fromEntity);
  }

  async startDay(id: string, userId: string): Promise<DayResponseDto> {
    const day = await this.loadDayWithOwnership(id, userId);
    if (day.startedAt) {
      throw new BadRequestException('Тренировка уже начата');
    }
    if (day.completedAt) {
      throw new BadRequestException('Тренировка уже завершена');
    }
    day.startedAt = new Date();
    await this.repo.save(day);
    return DayResponseDto.fromEntity(day);
  }

  async completeDay(id: string, userId: string): Promise<DayResponseDto> {
    const day = await this.loadDayWithOwnership(id, userId);
    if (!day.startedAt) {
      // Автостарт — если пользователь сразу отметил завершённой
      day.startedAt = new Date();
    }
    day.completedAt = new Date();
    await this.repo.save(day);
    return DayResponseDto.fromEntity(day);
  }

  // === private ===

  /**
   * Загружает день со всеми связями + проверяет, что программа принадлежит юзеру.
   * Защита от IDOR: без валидации владельца пользователь мог бы обращаться
   * к чужим training_day.id.
   */
  private async loadDayWithOwnership(id: string, userId: string): Promise<TrainingDay> {
    const day = await this.repo.findOne({
      where: { id },
      relations: {
        week: { program: true },
        exercises: { exercise: true },
      },
    });
    if (!day) throw new NotFoundException('Тренировочный день не найден');
    if (day.week.program.userId !== userId) {
      throw new ForbiddenException('Доступ к чужой тренировке запрещён');
    }
    return day;
  }
}
