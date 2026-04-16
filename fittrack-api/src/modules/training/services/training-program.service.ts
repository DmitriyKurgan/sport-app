import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AppCacheService, CACHE_TTL, cacheKeys } from '../../cache';
import { MetricsService } from '../../metrics';
import { ProfileService } from '../../profile/profile.service';
import {
  GeneratedProgram,
  ProfileConfig,
  TrainingEngineService,
} from '../../training-engine';
import {
  Exercise,
  TrainingDay,
  TrainingDayExercise,
  TrainingProgram,
  TrainingWeek,
} from '../entities';
import { ProgramResponseDto, ProgramSummaryDto } from '../dto/program-response.dto';
import { ExerciseService } from './exercise.service';

@Injectable()
export class TrainingProgramService {
  private readonly logger = new Logger(TrainingProgramService.name);

  constructor(
    @InjectRepository(TrainingProgram)
    private readonly programRepo: Repository<TrainingProgram>,
    private readonly dataSource: DataSource,
    private readonly engine: TrainingEngineService,
    private readonly profileService: ProfileService,
    private readonly exerciseService: ExerciseService,
    private readonly cache: AppCacheService,
    private readonly metrics: MetricsService,
  ) {}

  /**
   * Генерация 12-недельной программы:
   *   1. Загружаем профиль и каталог
   *   2. Вызываем чистый TrainingEngine → GeneratedProgram
   *   3. Деактивируем прошлую активную (если есть)
   *   4. В транзакции сохраняем всю структуру
   */
  async generate(userId: string): Promise<ProgramResponseDto> {
    const profileDto = await this.profileService.findByUserId(userId);
    const profileConfig = TrainingProgramService.toProfileConfig(profileDto);

    const catalog = await this.exerciseService.loadCatalogForEngine(profileDto.equipmentAccess);
    if (catalog.length === 0) {
      throw new BadRequestException(
        'Каталог упражнений пуст. Проверьте seed или доступное оборудование.',
      );
    }

    const stopTimer = this.metrics.programGenerationDuration.startTimer();
    const generated = this.engine.generateProgram(profileConfig, catalog);
    stopTimer();

    // Индекс слуга → id (nested writes требуют FK)
    const exercises = await this.exerciseService.loadAllActive();
    const slugToId = new Map(exercises.map((e) => [e.slug, e.id]));

    const result = await this.dataSource.transaction(async (manager) => {
      // Деактивируем предыдущую активную программу
      await manager
        .getRepository(TrainingProgram)
        .update({ userId, status: 'active' }, { status: 'abandoned' });

      const program = this.buildProgramGraph(
        userId,
        generated,
        slugToId,
        profileDto,
      );

      const saved = await manager.getRepository(TrainingProgram).save(program);
      // Перечитываем с полными relations для response
      return this.loadProgramWithRelations(saved.id, manager);
    });

    // Инвалидация: новая программа → выкидываем старые user-scoped кэши
    await this.cache.delMany([
      cacheKeys.activeProgram(userId),
      cacheKeys.dashboard(userId),
      cacheKeys.weeklyReport(userId),
    ]);

    this.metrics.programsGenerated.inc();
    return result;
  }

  async findActive(userId: string): Promise<ProgramResponseDto> {
    return this.cache.getOrCompute(
      cacheKeys.activeProgram(userId),
      CACHE_TTL.ACTIVE_PROGRAM_SECONDS,
      async () => {
        const program = await this.programRepo.findOne({
          where: { userId, status: 'active' },
          relations: {
            weeks: {
              days: {
                exercises: { exercise: true },
              },
            },
          },
        });
        if (!program) throw new NotFoundException('Активная программа не найдена');
        return ProgramResponseDto.fromEntity(program);
      },
    );
  }

  async findById(id: string, userId: string): Promise<ProgramResponseDto> {
    const program = await this.programRepo.findOne({
      where: { id, userId },
      relations: {
        weeks: {
          days: {
            exercises: { exercise: true },
          },
        },
      },
    });
    if (!program) throw new NotFoundException('Программа не найдена');
    return ProgramResponseDto.fromEntity(program);
  }

  async findAll(userId: string): Promise<ProgramSummaryDto[]> {
    const programs = await this.programRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return programs.map(ProgramSummaryDto.fromEntity);
  }

  async deactivate(id: string, userId: string): Promise<void> {
    const program = await this.programRepo.findOne({ where: { id, userId } });
    if (!program) throw new NotFoundException('Программа не найдена');
    program.status = 'abandoned';
    program.completedAt = new Date();
    await this.programRepo.save(program);
    await this.cache.delMany([
      cacheKeys.activeProgram(userId),
      cacheKeys.dashboard(userId),
    ]);
  }

  // === private helpers ===

  /**
   * Собирает TrainingProgram + вложенную структуру из GeneratedProgram.
   * Все промежуточные entity не сохраняются отдельно — TypeORM cascade:true
   * сохранит всё дерево одним save().
   */
  private buildProgramGraph(
    userId: string,
    generated: GeneratedProgram,
    slugToId: Map<string, string>,
    profileSnapshot: unknown,
  ): TrainingProgram {
    const program = new TrainingProgram();
    program.userId = userId;
    program.name = generated.name;
    program.status = 'active';
    program.totalWeeks = generated.totalWeeks;
    program.primaryGoal = generated.primaryGoal;
    program.experienceLevel = generated.experienceLevel;
    program.splitType = generated.splitType;
    program.weeklyDays = generated.weeklyDays;
    program.isLowIntensityMode = generated.isLowIntensityMode;
    program.configSnapshot = profileSnapshot as Record<string, unknown>;
    program.startedAt = new Date();

    program.weeks = generated.weeks.map((genWeek) => {
      const week = new TrainingWeek();
      week.weekNumber = genWeek.weekNumber;
      week.phase = genWeek.phase;
      week.mesocycleNumber = genWeek.mesocycleNumber;
      week.description = genWeek.description;
      week.isDeload = genWeek.isDeload;
      week.intensityModifier = genWeek.intensityModifier;
      week.volumeModifier = genWeek.volumeModifier;

      week.days = genWeek.days.map((genDay) => {
        const day = new TrainingDay();
        day.dayNumber = genDay.dayNumber;
        day.name = genDay.name;
        day.targetMuscles = genDay.targetPatterns;
        day.isRestDay = genDay.isRestDay;

        day.exercises = genDay.exercises.map((genEx) => {
          const dayEx = new TrainingDayExercise();
          // Используем exerciseId если engine его указал, иначе резолвим по slug
          dayEx.exerciseId = genEx.exerciseId || slugToId.get(genEx.exerciseSlug)!;
          if (!dayEx.exerciseId) {
            throw new BadRequestException(
              `Упражнение slug="${genEx.exerciseSlug}" отсутствует в БД`,
            );
          }
          dayEx.role = genEx.role;
          dayEx.orderIndex = genEx.orderIndex;
          dayEx.sets = genEx.sets;
          dayEx.repsMin = genEx.repsMin;
          dayEx.repsMax = genEx.repsMax;
          dayEx.targetRir = genEx.targetRIR;
          dayEx.targetLoadKg = genEx.targetLoadKg ?? null;
          dayEx.loadPctE1rm = genEx.loadPctE1RM ?? null;
          dayEx.restSeconds = genEx.restSeconds;
          dayEx.tempo = genEx.tempo ?? null;
          dayEx.notes = genEx.notes ?? null;
          return dayEx;
        });

        return day;
      });

      return week;
    });

    return program;
  }

  private async loadProgramWithRelations(
    programId: string,
    manager: DataSource['manager'],
  ): Promise<ProgramResponseDto> {
    const program = await manager.getRepository(TrainingProgram).findOneOrFail({
      where: { id: programId },
      relations: {
        weeks: {
          days: {
            exercises: { exercise: true },
          },
        },
      },
    });
    return ProgramResponseDto.fromEntity(program);
  }

  /**
   * ProfileResponseDto → ProfileConfig для TrainingEngine.
   * Static для тестируемости.
   */
  static toProfileConfig(profile: any): ProfileConfig {
    return {
      sex: profile.sex,
      ageYears: profile.ageYears,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      waistCm: profile.waistCm ?? null,
      experienceLevel: profile.experienceLevel,
      currentTrainingDaysPerWeek: profile.currentTrainingDaysPerWeek,
      technicalConfidence: profile.technicalConfidence ?? null,
      baselineStrength: profile.baselineStrength ?? null,
      primaryTrainingGoal: profile.primaryTrainingGoal,
      bodyweightGoal: profile.bodyweightGoal,
      weeklyTrainingDaysTarget: profile.weeklyTrainingDaysTarget,
      sessionDurationMinutes: profile.sessionDurationMinutes,
      equipmentAccess: profile.equipmentAccess,
      injuryPainFlags: profile.injuryPainFlags ?? [],
      preScreeningRedFlags: profile.preScreeningRedFlags,
      sleepHoursAvg: profile.sleepHoursAvg,
      stressLevel: profile.stressLevel,
      dailyActivityLevel: profile.dailyActivityLevel,
    };
  }
}
