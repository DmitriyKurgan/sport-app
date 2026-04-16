/**
 * Pure-функции трансформации данных для графиков.
 * Зеркало backend-логики (e1RM Эпли, weekly aggregations) — нужны
 * для on-the-fly расчёта на фронте, когда сервер не отдаёт уже агрегированное.
 *
 * Все функции чистые — легко тестируемы.
 */

import { BodyMeasurement, ProgressLog } from '@/types';

// ============= e1RM (формула Эпли) =============

export function calculateEstimated1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return Math.round(weightKg * 100) / 100;
  return Math.round(weightKg * (1 + reps / 30) * 100) / 100;
}

// ============= RIR ↔ RPE =============

/**
 * Маппинг RIR → RPE: RIR=0 ≈ RPE 10, RIR=2 ≈ RPE 8, RIR=4 ≈ RPE 6.
 * Фактически: RPE = 10 - RIR (для рабочих повторений).
 */
export function rirToRPE(rir: number): number {
  return Math.max(1, Math.min(10, 10 - rir));
}

export function rpeToRIR(rpe: number): number {
  return Math.max(0, Math.min(5, 10 - rpe));
}

// ============= Rolling average =============

/**
 * Скользящее среднее по окну в днях.
 * Точки без достаточной истории — null.
 */
export function calculateRollingAverage(
  points: Array<{ date: Date; value: number }>,
  windowDays: number,
): Array<{ date: Date; value: number; avg: number | null }> {
  return points.map((point) => {
    const from = new Date(point.date.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const inWindow = points.filter((p) => p.date >= from && p.date <= point.date);
    if (inWindow.length === 0) {
      return { ...point, avg: null };
    }
    const sum = inWindow.reduce((s, p) => s + p.value, 0);
    return { ...point, avg: Math.round((sum / inWindow.length) * 100) / 100 };
  });
}

// ============= Body weight: rolling avg 7 + 14 =============

export interface WeightTrendPoint {
  date: string;
  weightKg: number;
  avg7d: number | null;
  avg14d: number | null;
}

export function transformBodyWeight(measurements: BodyMeasurement[]): WeightTrendPoint[] {
  if (measurements.length === 0) return [];

  const sorted = [...measurements]
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());

  const points = sorted.map((m) => ({
    date: new Date(m.measuredAt),
    value: m.weightKg,
  }));

  const with7 = calculateRollingAverage(points, 7);
  const with14 = calculateRollingAverage(points, 14);

  return sorted.map((m, i) => ({
    date: m.measuredAt,
    weightKg: m.weightKg,
    avg7d: with7[i].avg,
    avg14d: with14[i].avg,
  }));
}

// ============= Exercise progress: per-day max + e1RM =============

export interface ExerciseProgressPoint {
  date: string;
  maxWeight: number;
  bestSet: { weightKg: number; reps: number };
  e1rm: number;
}

export function transformExerciseProgress(logs: ProgressLog[]): ExerciseProgressPoint[] {
  const working = logs.filter((l) => !l.isWarmup);
  if (working.length === 0) return [];

  // Группируем по дате (день)
  const byDay = new Map<string, ProgressLog[]>();
  for (const l of working) {
    const day = l.performedAt.slice(0, 10);
    const arr = byDay.get(day) ?? [];
    arr.push(l);
    byDay.set(day, arr);
  }

  return Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, dayLogs]) => {
      const maxWeight = Math.max(...dayLogs.map((l) => l.weightKg));
      // Best set: max(weight × reps)
      const bestSet = dayLogs.reduce((best, l) =>
        l.weightKg * l.reps > best.weightKg * best.reps ? l : best,
      );
      const e1rm = Math.max(
        ...dayLogs.map((l) => l.estimated1rm ?? calculateEstimated1RM(l.weightKg, l.reps)),
      );
      return {
        date,
        maxWeight,
        bestSet: { weightKg: bestSet.weightKg, reps: bestSet.reps },
        e1rm: Math.round(e1rm * 100) / 100,
      };
    });
}

// ============= Weekly aggregations =============

/** ISO Monday для даты (формат YYYY-MM-DD). */
function weekKey(date: Date): string {
  const d = new Date(date);
  const day = d.getDay() || 7;
  if (day !== 1) d.setDate(d.getDate() - (day - 1));
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export interface WeeklyVolumePoint {
  week: string;
  volumeLoad: number;
}

export function transformWeeklyVolumeLoad(logs: ProgressLog[]): WeeklyVolumePoint[] {
  const buckets = new Map<string, number>();
  for (const l of logs) {
    if (l.isWarmup) continue;
    const vl = l.volumeLoad ?? l.weightKg * l.reps;
    const wk = weekKey(new Date(l.performedAt));
    buckets.set(wk, (buckets.get(wk) ?? 0) + vl);
  }
  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, volumeLoad]) => ({ week, volumeLoad: Math.round(volumeLoad) }));
}

export interface WeeklyInternalLoadPoint {
  week: string;
  internalLoad: number;
}

export function transformWeeklyInternalLoad(
  logs: Array<{ recordedAt: string; internalLoad: number }>,
): WeeklyInternalLoadPoint[] {
  const buckets = new Map<string, number>();
  for (const l of logs) {
    const wk = weekKey(new Date(l.recordedAt));
    buckets.set(wk, (buckets.get(wk) ?? 0) + l.internalLoad);
  }
  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, internalLoad]) => ({ week, internalLoad: Math.round(internalLoad) }));
}

// ============= e1RM по main-lifts по неделям =============

export interface E1RMByMainLiftPoint {
  week: string;
  exerciseId: string;
  e1rm: number;
}

export function transformE1RMByMainLifts(
  logs: ProgressLog[],
  mainLiftIds: string[],
): E1RMByMainLiftPoint[] {
  const filtered = logs.filter((l) => !l.isWarmup && mainLiftIds.includes(l.exerciseId));
  // Группа: (week, exerciseId) → max(e1rm)
  const buckets = new Map<string, number>();
  for (const l of filtered) {
    const wk = weekKey(new Date(l.performedAt));
    const key = `${wk}::${l.exerciseId}`;
    const e1rm = l.estimated1rm ?? calculateEstimated1RM(l.weightKg, l.reps);
    const current = buckets.get(key) ?? 0;
    if (e1rm > current) buckets.set(key, e1rm);
  }
  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, e1rm]) => {
      const [week, exerciseId] = key.split('::');
      return { week, exerciseId, e1rm: Math.round(e1rm * 100) / 100 };
    });
}
