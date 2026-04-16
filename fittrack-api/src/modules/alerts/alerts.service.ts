import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { NutritionService } from '../nutrition/nutrition.service';
import { ProfileService } from '../profile/profile.service';
import { BodyMeasurementService } from '../progress/services/body-measurement.service';
import { ProgressLogService } from '../progress/services/progress-log.service';
import {
  Exercise,
  TrainingProgram,
} from '../training/entities';
import { Alert, AlertType } from './alert.entity';
import {
  detectOvertraining,
  detectRegression,
  detectStrengthPlateau,
  detectWeightPlateauCut,
} from './detectors';
import { ActOnResultDto, AlertResponseDto } from './dto/alert-response.dto';
import { DetectionResult, E1RMByWeek } from './interfaces';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(Alert)
    private readonly repo: Repository<Alert>,
    @InjectRepository(TrainingProgram)
    private readonly programRepo: Repository<TrainingProgram>,
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    private readonly profileService: ProfileService,
    private readonly progressLogService: ProgressLogService,
    private readonly bodyMeasurementService: BodyMeasurementService,
    private readonly nutritionService: NutritionService,
  ) {}

  // ============= queries =============

  async getActive(userId: string): Promise<AlertResponseDto[]> {
    const alerts = await this.repo.find({
      where: { userId, dismissedAt: IsNull() },
      order: { triggeredAt: 'DESC' },
    });
    return alerts.map(AlertResponseDto.fromEntity);
  }

  async dismiss(alertId: string, userId: string): Promise<AlertResponseDto> {
    const alert = await this.loadOwned(alertId, userId);
    alert.dismissedAt = new Date();
    await this.repo.save(alert);
    return AlertResponseDto.fromEntity(alert);
  }

  async actOn(alertId: string, userId: string): Promise<ActOnResultDto> {
    const alert = await this.loadOwned(alertId, userId);

    let performedAction = '';
    switch (alert.type) {
      case 'plateau_strength':
      case 'regression':
      case 'overtraining':
        // Триггер принудительного делoad: помечаем активную программу
        // (полная имплементация триггера делoada требует расширения TrainingModule
        // на этапе интеграции; здесь записываем сигнал в context программы).
        performedAction = await this.scheduleForcedDeload(userId);
        break;
      case 'weight_plateau_cut':
        // recalibrate с малым отрицательным дельтой → сервис применит −100 ккал
        await this.nutritionService.recalibrate(userId, 0);
        performedAction = 'Калории питания пересчитаны (−100 ккал/день)';
        break;
    }

    alert.actedUpon = true;
    alert.actedAt = new Date();
    alert.dismissedAt = new Date(); // act = автоматически dismissed
    await this.repo.save(alert);

    this.logger.log(
      `Alert acted on: userId=${userId}, type=${alert.type}, action="${performedAction}"`,
    );

    return {
      alert: AlertResponseDto.fromEntity(alert),
      performedAction,
    };
  }

  // ============= runAllDetectors =============

  /**
   * Главный orchestrator: собирает контекст из всех источников
   * и запускает 4 detector'а. Сохраняет новые алерты с дедупликацией.
   *
   * Дедупликация: если такой же type уже активен (dismissed_at IS NULL) —
   * новый не создаётся (избегаем спама).
   */
  async runAllDetectors(userId: string): Promise<AlertResponseDto[]> {
    const profile = await this.profileService.findByUserId(userId).catch(() => null);
    if (!profile) return [];

    const detected: DetectionResult[] = [];

    // 1. plateau-strength (нужен e1RM history по main_lifts + adherence)
    const plateauResult = await this.runPlateauDetector(userId);
    if (plateauResult) detected.push(plateauResult);

    // 2. regression (нужен e1RM trend + session-RPE trend)
    const regressionResult = await this.runRegressionDetector(userId);
    if (regressionResult) detected.push(regressionResult);

    // 3. weight_plateau_cut (нужен weight trend)
    const weightTrend = await this.bodyMeasurementService.getWeightTrend(userId, 30);
    const weightResult = detectWeightPlateauCut({
      bodyweightGoal: profile.bodyweightGoal as 'cut' | 'maintain' | 'bulk',
      weightTrend: weightTrend.map((p) => ({ date: p.date, avg14d: p.avg14d })),
    });
    if (weightResult) detected.push(weightResult);

    // 4. overtraining (нужен weekly session-RPE + sleep)
    const overtrainingResult = await this.runOvertrainingDetector(userId, profile.sleepHoursAvg);
    if (overtrainingResult) detected.push(overtrainingResult);

    // Сохранение с дедупликацией
    const created: AlertResponseDto[] = [];
    for (const result of detected) {
      const existingActive = await this.repo.findOne({
        where: { userId, type: result.type, dismissedAt: IsNull() },
      });
      if (existingActive) continue;

      const draft = this.repo.create({
        userId,
        type: result.type,
        severity: result.severity,
        title: result.title,
        message: result.message,
        recommendation: result.recommendation,
        context: result.context ?? null,
      });
      const saved = await this.repo.save(draft);
      created.push(AlertResponseDto.fromEntity(saved));
    }

    if (created.length > 0) {
      this.logger.log(`Created ${created.length} new alert(s) for user ${userId}`);
    }

    return created;
  }

  // ============= private helpers =============

  private async loadOwned(alertId: string, userId: string): Promise<Alert> {
    const alert = await this.repo.findOne({ where: { id: alertId } });
    if (!alert) throw new NotFoundException('Алерт не найден');
    if (alert.userId !== userId) throw new ForbiddenException('Доступ запрещён');
    return alert;
  }

  private async runPlateauDetector(userId: string): Promise<DetectionResult | null> {
    const activeProgram = await this.programRepo.findOne({
      where: { userId, status: 'active' },
      relations: { weeks: { days: { exercises: true } } },
    });
    if (!activeProgram) return null;

    // Собрать main_lifts ID (уникальные)
    const mainLiftIds = new Set<string>();
    for (const w of activeProgram.weeks) {
      for (const d of w.days) {
        for (const ex of d.exercises) {
          if (ex.role === 'main_lift') mainLiftIds.add(ex.exerciseId);
        }
      }
    }
    if (mainLiftIds.size === 0) return null;

    // Имена упражнений для сообщения
    const exercises = await this.exerciseRepo.findByIds([...mainLiftIds]);
    const nameMap = new Map(exercises.map((e) => [e.id, e.nameRu ?? e.name]));

    // e1RM history по неделям для каждого main_lift
    const mainLifts: E1RMByWeek[] = [];
    for (const exId of mainLiftIds) {
      const logs = await this.progressLogService.getByExercise(userId, exId);
      const weeklyMax = AlertsService.aggregateWeeklyMaxE1RM(logs);
      mainLifts.push({
        exerciseId: exId,
        exerciseName: nameMap.get(exId),
        history: weeklyMax,
      });
    }

    // adherence по программе на момент
    const totalDays = activeProgram.weeks.flatMap((w) => w.days).length;
    const completedDays = activeProgram.weeks
      .flatMap((w) => w.days)
      .filter((d) => !!d.completedAt).length;
    const adherencePct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    return detectStrengthPlateau({ mainLifts, adherencePct });
  }

  private async runRegressionDetector(userId: string): Promise<DetectionResult | null> {
    // Берём 3 последних значения e1RM по volume-load weekly
    const records = await this.progressLogService.getPersonalRecords(userId);
    if (records.length === 0) return null;

    // Усреднённое e1RM по последним записям (упрощённо: через personal records)
    // В реальности можно сделать GROUP BY week, но для MVP детекторов хватает trend
    const recentE1RM = records
      .sort((a, b) => a.achievedAt.getTime() - b.achievedAt.getTime())
      .slice(-3)
      .map((r) => r.prE1rmKg);

    const internalLoad = await this.progressLogService.getInternalLoadByWeek(userId);
    const sessionRPETrend = internalLoad
      .slice(-3)
      .map((w) => w.value / 60); // примерная оценка sRPE

    return detectRegression({ recentE1RM, sessionRPETrend });
  }

  private async runOvertrainingDetector(
    userId: string,
    sleepHoursAvg: number,
  ): Promise<DetectionResult | null> {
    const internalLoad = await this.progressLogService.getInternalLoadByWeek(userId);
    if (internalLoad.length < 3) return null;

    // session-RPE = internal_load / duration. Без duration аппроксимируем как load/60.
    const weeklySessionRPE = internalLoad.slice(-3).map((w) => ({
      weekStart: w.weekStart,
      avgSessionRPE: w.value / 60,
    }));

    return detectOvertraining({ weeklySessionRPE, sleepHoursAvg });
  }

  /**
   * Триггер принудительного делoad: запоминаем сигнал в БД через configSnapshot.
   *
   * Полная интеграция (модификация плана будущих недель) — отдельная задача
   * следующего этапа интеграции. На текущий момент детектор только записывает
   * флаг, который TrainingProgramService может прочитать при пересборке.
   */
  private async scheduleForcedDeload(userId: string): Promise<string> {
    const program = await this.programRepo.findOne({
      where: { userId, status: 'active' },
    });
    if (!program) return 'Активная программа не найдена';

    const snapshot = (program.configSnapshot as Record<string, unknown>) ?? {};
    snapshot.forcedDeloadRequestedAt = new Date().toISOString();
    program.configSnapshot = snapshot;
    await this.programRepo.save(program);

    return 'Принудительный делoad запланирован на следующую неделю программы';
  }

  // ============= static pure helpers =============

  /**
   * Pure: группирует логи по неделям, берёт max(e1RM) в каждой неделе.
   * Возвращает массив значений в порядке возрастания недели.
   */
  static aggregateWeeklyMaxE1RM(
    logs: Array<{ performedAt: Date; estimated1rm: number | null; isWarmup: boolean }>,
  ): number[] {
    const buckets = new Map<string, number>();
    for (const log of logs) {
      if (log.isWarmup || log.estimated1rm === null) continue;
      const wkKey = AlertsService.weekKey(log.performedAt);
      const current = buckets.get(wkKey) ?? 0;
      if (log.estimated1rm > current) buckets.set(wkKey, log.estimated1rm);
    }
    return [...buckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, v]) => v);
  }

  static weekKey(date: Date): string {
    // YYYY-MM-DD первого дня недели
    const d = new Date(date);
    const day = d.getDay() || 7;
    if (day !== 1) d.setDate(d.getDate() - (day - 1));
    return d.toISOString().slice(0, 10);
  }
}
