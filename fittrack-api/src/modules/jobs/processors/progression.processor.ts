import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import {
  TrainingDay,
  TrainingDayExercise,
  TrainingProgram,
  TrainingWeek,
} from '../../training/entities';
import { TrainingEngineService } from '../../training-engine';
import { isCompoundByPatterns } from '../../training-engine/constants/compound-slugs';
import { ProgressLog } from '../../progress/entities';
import { JOB_NAMES, QUEUE_NAMES } from '../queues';

interface Payload {
  userId: string;
  /** Завершённый тренировочный день. */
  trainingDayId: string;
}

/**
 * После завершения дня — проверяет: это последний день недели?
 * Если да — для каждого упражнения следующей недели вызывает
 * TrainingEngine.calculateProgression() и обновляет target_load_kg.
 */
@Processor(QUEUE_NAMES.PROGRESSION)
export class ProgressionProcessor {
  private readonly logger = new Logger(ProgressionProcessor.name);

  constructor(
    @InjectRepository(TrainingDay)
    private readonly dayRepo: Repository<TrainingDay>,
    @InjectRepository(TrainingWeek)
    private readonly weekRepo: Repository<TrainingWeek>,
    @InjectRepository(TrainingProgram)
    private readonly programRepo: Repository<TrainingProgram>,
    @InjectRepository(TrainingDayExercise)
    private readonly dayExRepo: Repository<TrainingDayExercise>,
    @InjectRepository(ProgressLog)
    private readonly logRepo: Repository<ProgressLog>,
    private readonly engine: TrainingEngineService,
  ) {}

  @Process(JOB_NAMES.CHECK_PROGRESSION)
  async check(job: Job<Payload>): Promise<void> {
    const { userId, trainingDayId } = job.data;

    const completedDay = await this.dayRepo.findOne({
      where: { id: trainingDayId },
      relations: { week: { program: true } },
    });
    if (!completedDay) return;

    // Проверяем что неделя завершена полностью
    const week = await this.weekRepo.findOne({
      where: { id: completedDay.weekId },
      relations: { days: { exercises: { exercise: true } } },
    });
    if (!week) return;

    const allCompleted = week.days.every((d) => !!d.completedAt);
    if (!allCompleted) {
      this.logger.debug(
        `Week ${week.weekNumber} not yet complete — skipping progression`,
      );
      return;
    }

    // Найти следующую неделю той же программы
    const nextWeek = await this.weekRepo.findOne({
      where: {
        programId: week.programId,
        weekNumber: week.weekNumber + 1,
      },
      relations: { days: { exercises: { exercise: true } } },
    });
    if (!nextWeek) {
      this.logger.log(`User ${userId}: program complete (week ${week.weekNumber})`);
      return;
    }

    // Для каждого упражнения текущей недели → найти соответствующее в следующей и пересчитать
    let updated = 0;
    for (const day of week.days) {
      for (const ex of day.exercises) {
        const result = await this.calculateProgressionForExercise(userId, week, ex);
        if (!result) continue;

        // Применить ко всем упражнениям next-week с тем же exerciseId
        for (const nextDay of nextWeek.days) {
          for (const nextEx of nextDay.exercises) {
            if (nextEx.exerciseId !== ex.exerciseId) continue;
            nextEx.targetLoadKg = result.newWeightKg;
            await this.dayExRepo.save(nextEx);
            updated++;
          }
        }
      }
    }

    this.logger.log(
      `User ${userId}, week ${week.weekNumber}→${nextWeek.weekNumber}: updated ${updated} exercise(s)`,
    );
  }

  // ============= private =============

  private async calculateProgressionForExercise(
    userId: string,
    week: TrainingWeek,
    ex: TrainingDayExercise,
  ): Promise<{ newWeightKg: number | null } | null> {
    if (!ex.targetLoadKg) return null;

    // Логи текущей недели по этому упражнению
    const weekStart = new Date(week.createdAt);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const currentLogs = await this.logRepo.find({
      where: {
        userId,
        exerciseId: ex.exerciseId,
        performedAt: MoreThanOrEqual(weekStart),
      },
    });
    const filtered = currentLogs.filter((l) => l.performedAt < weekEnd);
    if (filtered.length === 0) return null;

    // Логи предыдущей недели — для определения previousWeekHit
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevLogs = await this.logRepo.find({
      where: {
        userId,
        exerciseId: ex.exerciseId,
        performedAt: MoreThanOrEqual(prevWeekStart),
        // и < weekStart
      },
    });
    const prevFiltered = prevLogs.filter((l) => l.performedAt < weekStart);
    const previousWeekHit =
      prevFiltered.length > 0 &&
      prevFiltered.every((l) => l.reps >= ex.repsMax && (l.rir ?? 0) <= (ex.targetRir ?? 2));

    const isCompound = isCompoundByPatterns(ex.exercise?.movementPatterns ?? []);
    const result = this.engine.calculateProgression({
      currentWeekLogs: filtered.map((l) => ({
        weightKg: l.weightKg,
        reps: l.reps,
        rir: l.rir,
        rpe: l.rpe,
        isWarmup: l.isWarmup,
      })),
      plan: {
        exerciseId: ex.exerciseId,
        sets: ex.sets,
        repsMin: ex.repsMin,
        repsMax: ex.repsMax,
        targetRIR: ex.targetRir ?? 2,
        targetLoadKg: ex.targetLoadKg,
        isCompound,
      },
      previousWeekHit,
    });

    if (result.action === 'HOLD' && !result.targetRepsIncrement) return null;
    return { newWeightKg: result.newWeightKg ?? ex.targetLoadKg };
  }
}

/** Suppress unused warning. */
void LessThan;
