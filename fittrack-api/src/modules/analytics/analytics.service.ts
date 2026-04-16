import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { AppCacheService, CACHE_TTL, cacheKeys } from '../cache';
import { ProfileService } from '../profile/profile.service';
import { BodyMeasurementService } from '../progress/services/body-measurement.service';
import { ProgressLogService } from '../progress/services/progress-log.service';
import { TrainingEngineService } from '../training-engine';
import { ProgramPhase } from '../training-engine/enums';
import { Exercise, TrainingDay, TrainingProgram } from '../training/entities';
import {
  BodyCompositionPoint,
  ChartDataPoint,
  DashboardResponse,
  ExerciseProgressPoint,
  RecordCard,
  WeeklyReport,
} from './interfaces';
import {
  calculateConsistencyScore,
  daysAgo,
  endOfWeek,
  generateWeeklyInsights,
  startOfWeek,
} from './helpers';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(TrainingProgram)
    private readonly programRepo: Repository<TrainingProgram>,
    @InjectRepository(TrainingDay)
    private readonly dayRepo: Repository<TrainingDay>,
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    private readonly profileService: ProfileService,
    private readonly progressLogService: ProgressLogService,
    private readonly bodyMeasurementService: BodyMeasurementService,
    private readonly engine: TrainingEngineService,
    private readonly cache: AppCacheService,
  ) {}

  // ============= getDashboard =============

  async getDashboard(userId: string): Promise<DashboardResponse> {
    return this.cache.getOrCompute(
      cacheKeys.dashboard(userId),
      CACHE_TTL.DASHBOARD_SECONDS,
      () => this.computeDashboard(userId),
    );
  }

  private async computeDashboard(userId: string): Promise<DashboardResponse> {
    // 1. Активная программа + текущая неделя
    const activeProgram = await this.programRepo.findOne({
      where: { userId, status: 'active' },
      relations: { weeks: { days: true } },
    });

    let currentProgram: DashboardResponse['currentProgram'] = null;
    let weekProgress: DashboardResponse['weekProgress'] = {
      planned: 0,
      completed: 0,
      upcoming: [],
    };
    let consistencyScore = 0;

    if (activeProgram) {
      const { week, weekNumber } = AnalyticsService.findCurrentWeek(activeProgram);
      const completedDays = (week?.days ?? []).filter((d) => !!d.completedAt).length;
      const plannedDays = week?.days.length ?? 0;

      currentProgram = {
        id: activeProgram.id,
        name: activeProgram.name,
        weekNumber,
        totalWeeks: activeProgram.totalWeeks,
        phase: week?.phase ?? ProgramPhase.ADAPTATION,
        completedDays,
        totalDays: activeProgram.weeks.reduce((sum, w) => sum + w.days.length, 0),
      };

      weekProgress = {
        planned: plannedDays,
        completed: completedDays,
        upcoming: (week?.days ?? [])
          .filter((d) => !d.completedAt && !d.startedAt)
          .map((d) => ({ dayId: d.id, name: d.name, dayNumber: d.dayNumber })),
      };

      // Consistency по всей программе на момент
      const allCompleted = activeProgram.weeks
        .flatMap((w) => w.days)
        .filter((d) => !!d.completedAt).length;
      const allDaysToCurrentWeek = activeProgram.weeks
        .filter((w) => w.weekNumber <= weekNumber)
        .reduce((sum, w) => sum + w.days.length, 0);
      consistencyScore = calculateConsistencyScore(allCompleted, allDaysToCurrentWeek);
    }

    // 2. Параллельно собираем остальное
    const [recentRecords, bodyWeight, totalVolume, internalLoad] = await Promise.all([
      this.getRecentRecords(userId, 30),
      this.getBodyWeightChart(userId, 30),
      this.getVolumeLoadChart(userId, 4),
      this.getInternalLoadChart(userId, 4),
    ]);

    // 3. avgRIR по main_lifts текущей недели
    let avgRIRMainLifts: number | null = null;
    if (activeProgram) {
      const { week } = AnalyticsService.findCurrentWeek(activeProgram);
      if (week) {
        const mainLiftIds = AnalyticsService.collectMainLiftIds(week);
        const wkStart = startOfWeek(week.days[0]?.startedAt ?? new Date());
        avgRIRMainLifts = await this.progressLogService.getAvgRIRMainLifts(
          userId,
          wkStart,
          mainLiftIds,
        );
      }
    }

    return {
      currentProgram,
      weekProgress,
      recentRecords,
      bodyWeight,
      totalVolume,
      internalLoad,
      avgRIRMainLifts,
      consistencyScore,
    };
  }

  // ============= getExerciseProgress =============

  async getExerciseProgress(
    userId: string,
    exerciseId: string,
  ): Promise<ExerciseProgressPoint[]> {
    const logs = await this.progressLogService.getByExercise(userId, exerciseId);
    return logs
      .filter((l) => !l.isWarmup && l.estimated1rm !== null)
      .map((l) => ({
        date: l.performedAt.toISOString(),
        weightKg: l.weightKg,
        reps: l.reps,
        e1rm: l.estimated1rm!,
      }));
  }

  // ============= getVolumeLoadAnalytics / getInternalLoadAnalytics =============

  async getVolumeLoadAnalytics(userId: string): Promise<ChartDataPoint[]> {
    const weekly = await this.progressLogService.getVolumeLoadByWeek(userId);
    return weekly.map((w) => ({
      date: w.weekStart.toISOString(),
      value: w.value,
    }));
  }

  async getInternalLoadAnalytics(userId: string): Promise<ChartDataPoint[]> {
    const weekly = await this.progressLogService.getInternalLoadByWeek(userId);
    return weekly.map((w) => ({
      date: w.weekStart.toISOString(),
      value: w.value,
    }));
  }

  // ============= getBodyComposition =============

  async getBodyComposition(userId: string, days = 90): Promise<BodyCompositionPoint[]> {
    const measurements = await this.bodyMeasurementService.findAll(userId);
    const since = daysAgo(days);
    return measurements
      .filter((m) => m.measuredAt >= since)
      .reverse() // findAll возвращает DESC, нам нужен ASC
      .map((m) => ({
        date: m.measuredAt.toISOString(),
        weightKg: m.weightKg,
        bodyFatPercent: m.bodyFatPercent,
        chestCm: m.chestCm,
        waistCm: m.waistCm,
        hipsCm: m.hipsCm,
        bicepsCm: m.bicepsCm,
        thighCm: m.thighCm,
      }));
  }

  // ============= getWeeklyReport =============

  async getWeeklyReport(userId: string): Promise<WeeklyReport> {
    return this.cache.getOrCompute(
      cacheKeys.weeklyReport(userId),
      CACHE_TTL.WEEKLY_REPORT_SECONDS,
      () => this.computeWeeklyReport(userId),
    );
  }

  private async computeWeeklyReport(userId: string): Promise<WeeklyReport> {
    const now = new Date();
    const wkStart = startOfWeek(now);
    const wkEnd = endOfWeek(now);
    const profile = await this.profileService.findByUserId(userId);

    // Сессии за неделю
    const sessions = await this.dayRepo.find({
      where: {
        week: { program: { userId, status: 'active' } },
        completedAt: Between(wkStart, wkEnd),
      },
      relations: { week: { program: true }, exercises: true },
    });
    const completedSessions = sessions.length;

    // Запланированные сессии за неделю
    let plannedSessions = 0;
    const activeProgram = await this.programRepo.findOne({
      where: { userId, status: 'active' },
      relations: { weeks: { days: true } },
    });
    if (activeProgram) {
      const { week } = AnalyticsService.findCurrentWeek(activeProgram);
      plannedSessions = week?.days.length ?? 0;
    }

    // Volume + internal load за неделю
    const volumeWeekly = await this.progressLogService.getVolumeLoadByWeek(userId);
    const totalVolumeLoad = AnalyticsService.findWeekValue(volumeWeekly, wkStart);

    const internalWeekly = await this.progressLogService.getInternalLoadByWeek(userId);
    const totalInternalLoad = AnalyticsService.findWeekValue(internalWeekly, wkStart);

    // avgRIR + avgRPE
    const avgRIR = await this.progressLogService.getAvgRIRMainLifts(userId, wkStart);
    const avgSessionRPE = totalInternalLoad > 0 && completedSessions > 0
      ? totalInternalLoad / completedSessions / 60 // примерная оценка: load / duration ≈ rpe
      : null;

    // Тренд веса за неделю
    const weightTrend = await this.bodyMeasurementService.getWeightTrend(userId, 14);
    const weightDeltaKg = AnalyticsService.calculateWeightDelta(weightTrend);

    // PRs за неделю (упрощённо: новые рекорды по всем упражнениям)
    const newPRs = await this.countNewPRsThisWeek(userId, wkStart, wkEnd);

    // e1RM delta — текущая лучшая vs предыдущая
    const e1rmDelta = await this.calculateE1RMDelta(userId, wkStart);

    const insights = generateWeeklyInsights({
      e1rmDelta,
      newPRs,
      consistencyPct: calculateConsistencyScore(completedSessions, plannedSessions),
      avgRIR,
      avgSessionRPE,
      sleepHoursAvg: profile.sleepHoursAvg,
      weightDeltaKg,
      bodyweightGoal: profile.bodyweightGoal as 'cut' | 'maintain' | 'bulk',
    });

    return {
      weekStart: wkStart,
      weekEnd: wkEnd,
      insights,
      metrics: {
        completedSessions,
        plannedSessions,
        avgRIR,
        totalVolumeLoad,
        totalInternalLoad,
      },
    };
  }

  // ============= helpers =============

  /**
   * Pure: ищет текущую неделю программы по startedAt-полям дней
   * (берём первую неделю, в которой остались незавершённые дни).
   * Если все завершены — последняя.
   */
  static findCurrentWeek(program: TrainingProgram): {
    week: TrainingProgram['weeks'][0] | null;
    weekNumber: number;
  } {
    const sortedWeeks = (program.weeks ?? []).slice().sort((a, b) => a.weekNumber - b.weekNumber);
    for (const w of sortedWeeks) {
      const allCompleted = w.days.every((d) => !!d.completedAt);
      if (!allCompleted) return { week: w, weekNumber: w.weekNumber };
    }
    const last = sortedWeeks[sortedWeeks.length - 1];
    return { week: last ?? null, weekNumber: last?.weekNumber ?? 1 };
  }

  static collectMainLiftIds(week: TrainingProgram['weeks'][0]): string[] {
    const ids = new Set<string>();
    for (const day of week.days ?? []) {
      for (const ex of day.exercises ?? []) {
        if (ex.role === 'main_lift') ids.add(ex.exerciseId);
      }
    }
    return Array.from(ids);
  }

  static findWeekValue(weekly: { weekStart: Date; value: number }[], target: Date): number {
    const targetTs = startOfWeek(target).getTime();
    const found = weekly.find((w) => startOfWeek(w.weekStart).getTime() === targetTs);
    return found?.value ?? 0;
  }

  static calculateWeightDelta(
    trend: Array<{ date: Date; weightKg: number; avg7d: number | null }>,
  ): number {
    if (trend.length < 2) return 0;
    const first = trend[0].avg7d ?? trend[0].weightKg;
    const last = trend[trend.length - 1].avg7d ?? trend[trend.length - 1].weightKg;
    return Math.round((last - first) * 10) / 10;
  }

  // === private DB helpers ===

  private async getRecentRecords(userId: string, days: number): Promise<RecordCard[]> {
    const since = daysAgo(days);
    const records = await this.progressLogService.getPersonalRecords(userId);
    const recent = records.filter((r) => r.achievedAt >= since);
    if (recent.length === 0) return [];

    const exerciseIds = recent.map((r) => r.exerciseId);
    const exercises = await this.exerciseRepo.findBy({ id: In(exerciseIds) });
    const nameMap = new Map(exercises.map((e) => [e.id, e.nameRu ?? e.name]));

    return recent.map((r) => ({
      exerciseId: r.exerciseId,
      exerciseName: nameMap.get(r.exerciseId) ?? '—',
      prWeightKg: r.prWeightKg,
      prE1rmKg: r.prE1rmKg,
      achievedAt: r.achievedAt,
    }));
  }

  private async getBodyWeightChart(userId: string, days: number): Promise<ChartDataPoint[]> {
    const trend = await this.bodyMeasurementService.getWeightTrend(userId, days);
    return trend.map((p) => ({
      date: p.date.toISOString(),
      value: p.weightKg,
      label: p.avg7d !== null ? `7d avg: ${p.avg7d}` : undefined,
    }));
  }

  private async getVolumeLoadChart(userId: string, weeks: number): Promise<ChartDataPoint[]> {
    const all = await this.progressLogService.getVolumeLoadByWeek(userId);
    return all.slice(-weeks).map((w, idx) => ({
      date: w.weekStart.toISOString(),
      value: w.value,
      label: `Неделя ${all.length - weeks + idx + 1}`,
    }));
  }

  private async getInternalLoadChart(userId: string, weeks: number): Promise<ChartDataPoint[]> {
    const all = await this.progressLogService.getInternalLoadByWeek(userId);
    return all.slice(-weeks).map((w) => ({
      date: w.weekStart.toISOString(),
      value: w.value,
    }));
  }

  private async countNewPRsThisWeek(
    userId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<number> {
    const records = await this.progressLogService.getPersonalRecords(userId);
    return records.filter((r) => r.achievedAt >= weekStart && r.achievedAt <= weekEnd).length;
  }

  private async calculateE1RMDelta(userId: string, weekStart: Date): Promise<number> {
    // Усреднённая e1RM текущей недели минус предыдущей.
    // Пока просто используем records — упрощённая оценка.
    const records = await this.progressLogService.getPersonalRecords(userId);
    if (records.length === 0) return 0;
    const currentWeekMax = records
      .filter((r) => r.achievedAt >= weekStart)
      .reduce((s, r) => s + r.prE1rmKg, 0);
    const previousWeekStart = new Date(weekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const previousWeekMax = records
      .filter((r) => r.achievedAt >= previousWeekStart && r.achievedAt < weekStart)
      .reduce((s, r) => s + r.prE1rmKg, 0);
    return Math.round((currentWeekMax - previousWeekMax) * 10) / 10;
  }
}
