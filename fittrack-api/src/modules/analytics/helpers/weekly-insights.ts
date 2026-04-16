import { WeeklyInsight } from '../interfaces';

/**
 * Контекст для генерации weekly insights.
 * Все поля собирает AnalyticsService из других сервисов.
 */
export interface InsightsContext {
  /** e1RM по main_lifts: prevWeek и currentWeek в кг. */
  e1rmDelta: number; // positive = выросло, negative = упало
  /** Число побитых PR за неделю. */
  newPRs: number;
  /** completedDays / plannedDays × 100. */
  consistencyPct: number;
  /** Средний RIR по main_lifts (null если данных нет). */
  avgRIR: number | null;
  /** Средний session-RPE за неделю (null если нет). */
  avgSessionRPE: number | null;
  /** Средние сны за неделю (число). */
  sleepHoursAvg: number;
  /** Дельта веса за неделю (для cut/bulk оценки). */
  weightDeltaKg: number;
  /** Цель пользователя по весу: cut / maintain / bulk. */
  bodyweightGoal: 'cut' | 'maintain' | 'bulk';
}

/**
 * Pure: генерирует ровно 3 инсайта.
 * Логика:
 *   1. **improvement** — лучшее достижение недели
 *   2. **blocker** — главное препятствие (или нейтральная картина)
 *   3. **recommendation** — действие на следующую неделю
 */
export function generateWeeklyInsights(ctx: InsightsContext): WeeklyInsight[] {
  return [pickImprovement(ctx), pickBlocker(ctx), pickRecommendation(ctx)];
}

function pickImprovement(ctx: InsightsContext): WeeklyInsight {
  if (ctx.newPRs > 0) {
    return {
      category: 'improvement',
      title: `Новые рекорды: ${ctx.newPRs}`,
      message: `Вы побили ${ctx.newPRs} личных рекордов на этой неделе. Отличная работа.`,
    };
  }
  if (ctx.e1rmDelta > 1) {
    return {
      category: 'improvement',
      title: 'Сила растёт',
      message: `Estimated 1RM по основным движениям прибавил +${ctx.e1rmDelta.toFixed(1)} кг.`,
    };
  }
  if (ctx.consistencyPct >= 90) {
    return {
      category: 'improvement',
      title: 'Высокая регулярность',
      message: `Вы выполнили ${ctx.consistencyPct}% запланированных тренировок.`,
    };
  }
  if (ctx.bodyweightGoal === 'cut' && ctx.weightDeltaKg < -0.2 && ctx.weightDeltaKg > -1.5) {
    return {
      category: 'improvement',
      title: 'Вес снижается в норме',
      message: `Темп −${Math.abs(ctx.weightDeltaKg).toFixed(1)} кг за неделю в безопасном диапазоне.`,
    };
  }
  if (ctx.bodyweightGoal === 'bulk' && ctx.weightDeltaKg > 0.1 && ctx.weightDeltaKg < 0.5) {
    return {
      category: 'improvement',
      title: 'Вес растёт без перебора',
      message: `+${ctx.weightDeltaKg.toFixed(1)} кг — оптимальный темп для набора массы.`,
    };
  }
  return {
    category: 'improvement',
    title: 'Стабильность',
    message: 'Вы продолжаете двигаться по программе. Это уже результат.',
  };
}

function pickBlocker(ctx: InsightsContext): WeeklyInsight {
  if (ctx.consistencyPct < 50) {
    return {
      category: 'blocker',
      title: 'Низкая регулярность',
      message: `Только ${ctx.consistencyPct}% тренировок выполнено — это главный риск прогресса.`,
    };
  }
  if (ctx.avgSessionRPE !== null && ctx.avgSessionRPE > 9) {
    return {
      category: 'blocker',
      title: 'Признаки перегруза',
      message: `Средний session-RPE ${ctx.avgSessionRPE.toFixed(1)} — тренировки субъективно очень тяжёлые.`,
    };
  }
  if (ctx.avgRIR !== null && ctx.avgRIR < 1) {
    return {
      category: 'blocker',
      title: 'RIR близок к нулю',
      message: 'Вы постоянно работаете до отказа — рискуете накопить усталость без отдачи.',
    };
  }
  if (ctx.sleepHoursAvg < 6) {
    return {
      category: 'blocker',
      title: 'Недостаток сна',
      message: `Среднее ${ctx.sleepHoursAvg.toFixed(1)} ч/ночь — восстановление страдает.`,
    };
  }
  if (ctx.e1rmDelta < -1) {
    return {
      category: 'blocker',
      title: 'Регресс силы',
      message: `e1RM упал на ${Math.abs(ctx.e1rmDelta).toFixed(1)} кг — пересмотрите нагрузку.`,
    };
  }
  return {
    category: 'blocker',
    title: 'Существенных блокеров нет',
    message: 'Видимых проблем не обнаружено. Так держать.',
  };
}

function pickRecommendation(ctx: InsightsContext): WeeklyInsight {
  if (ctx.avgSessionRPE !== null && ctx.avgSessionRPE > 9) {
    return {
      category: 'recommendation',
      title: 'Запланируйте делoad',
      message: 'Снизьте объём на 30–40% на следующую неделю, чтобы восстановиться.',
    };
  }
  if (ctx.avgRIR !== null && ctx.avgRIR < 1) {
    return {
      category: 'recommendation',
      title: 'Увеличьте RIR',
      message: 'На следующей неделе старайтесь оставлять 2–3 повтора в запасе на каждом подходе.',
    };
  }
  if (ctx.consistencyPct < 50) {
    return {
      category: 'recommendation',
      title: 'Уменьшите частоту',
      message: 'Если 4+ дня в неделю не получается — снизьте до 3 и держите регулярность.',
    };
  }
  if (ctx.e1rmDelta > 1 && ctx.avgRIR !== null && ctx.avgRIR >= 2) {
    return {
      category: 'recommendation',
      title: 'Готовы к прибавке',
      message: 'Прогресс есть, RIR в норме — можно поднять веса по double progression.',
    };
  }
  if (ctx.bodyweightGoal === 'cut' && Math.abs(ctx.weightDeltaKg) < 0.2) {
    return {
      category: 'recommendation',
      title: 'Плато по весу',
      message: 'Вес не меняется 2 нед — попробуйте −100 ккал/день или +1500 шагов.',
    };
  }
  return {
    category: 'recommendation',
    title: 'Продолжайте план',
    message: 'Текущая программа работает — придерживайтесь её на следующей неделе.',
  };
}
