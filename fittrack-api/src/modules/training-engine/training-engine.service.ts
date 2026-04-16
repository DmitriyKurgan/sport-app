import { Injectable } from '@nestjs/common';
import {
  calculateE1RM,
  calculateInternalLoad,
  calculateProgression,
  calculateVolumeLoad,
  detectE1RMDrop,
  ProgressionContext,
  shouldDeload,
} from './calculators';
import {
  generateLowIntensityProgram,
  generateProgram,
  resolveDaysTarget,
} from './generators';
import {
  DeloadContext,
  DeloadDecision,
  ExerciseCatalogItem,
  GeneratedProgram,
  ProfileConfig,
  ProgressionResult,
  RecalibrationResult,
  SetLog,
} from './interfaces';

/**
 * Фасад TrainingEngine — pure service без side effects и без DB.
 * Все методы детерминированы: одинаковый input → одинаковый output.
 *
 * Consumer (TrainingModule на Этапе 7) вызывает generateProgram() и сохраняет результат в БД.
 */
@Injectable()
export class TrainingEngineService {
  // === Program generation ===

  generateProgram(
    profile: ProfileConfig,
    catalog: ExerciseCatalogItem[],
  ): GeneratedProgram {
    return generateProgram(profile, catalog);
  }

  generateLowIntensityProgram(
    profile: ProfileConfig,
    catalog: ExerciseCatalogItem[],
  ): GeneratedProgram {
    return generateLowIntensityProgram(profile, catalog);
  }

  resolveDaysTarget(profile: ProfileConfig): number {
    return resolveDaysTarget(profile);
  }

  // === Autoregulation & progression ===

  calculateProgression(ctx: ProgressionContext): ProgressionResult {
    return calculateProgression(ctx);
  }

  shouldDeload(ctx: DeloadContext): DeloadDecision {
    return shouldDeload(ctx);
  }

  detectE1RMDrop(history: number[], thresholdPct = 5): boolean {
    return detectE1RMDrop(history, thresholdPct);
  }

  // === Metric calculators ===

  calculateE1RM(weightKg: number, reps: number): number {
    return calculateE1RM(weightKg, reps);
  }

  calculateVolumeLoad(logs: SetLog[]): number {
    return calculateVolumeLoad(logs);
  }

  calculateInternalLoad(sessionRPE: number, durationMinutes: number): number {
    return calculateInternalLoad(sessionRPE, durationMinutes);
  }

  // === Calibration ===

  /**
   * Если у пользователя нет baseline-силы, неделя 1 служит калибровкой.
   * По фактическим подходам недели 1 выводим стартовый target вес:
   *   - берём подход в целевом диапазоне reps с RIR 3-4 (не около отказа)
   *   - применяем как target на неделю 2 с intensityModifier 0.8 (адаптация)
   */
  recalibrateFirstWeek(
    week1Logs: Array<{ exerciseId: string; logs: SetLog[] }>,
  ): RecalibrationResult[] {
    const results: RecalibrationResult[] = [];

    for (const { exerciseId, logs } of week1Logs) {
      const workingSets = logs.filter((l) => !l.isWarmup);
      if (workingSets.length === 0) continue;

      // Берём максимальный вес из подходов с RIR >= 2 (не отказ)
      const safeSets = workingSets.filter(
        (s) => s.rir !== null && s.rir !== undefined && s.rir >= 2,
      );
      const reference = safeSets.length > 0 ? safeSets : workingSets;
      const calibratedLoadKg = Math.max(...reference.map((s) => s.weightKg));

      results.push({
        exerciseId,
        calibratedLoadKg: Math.round(calibratedLoadKg * 2) / 2,
        reason:
          safeSets.length > 0
            ? 'based_on_rir_safe_sets'
            : 'fallback_to_all_working_sets',
      });
    }

    return results;
  }
}
