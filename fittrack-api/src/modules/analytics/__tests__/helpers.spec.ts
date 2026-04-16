import {
  calculateConsistencyScore,
  daysAgo,
  endOfWeek,
  generateWeeklyInsights,
  startOfWeek,
} from '../helpers';

describe('analytics helpers', () => {
  describe('calculateConsistencyScore', () => {
    it('100% если completed === planned', () => {
      expect(calculateConsistencyScore(4, 4)).toBe(100);
    });

    it('50% если выполнили половину', () => {
      expect(calculateConsistencyScore(2, 4)).toBe(50);
    });

    it('0 если planned=0 (защита от деления на ноль)', () => {
      expect(calculateConsistencyScore(0, 0)).toBe(0);
    });

    it('round до целого', () => {
      expect(calculateConsistencyScore(2, 3)).toBe(67);
    });

    it('cap 100% если completed > planned', () => {
      expect(calculateConsistencyScore(10, 4)).toBe(100);
    });
  });

  describe('startOfWeek / endOfWeek', () => {
    it('понедельник для среды', () => {
      const wed = new Date('2026-04-15'); // среда
      const monday = startOfWeek(wed);
      expect(monday.getDay()).toBe(1);
      expect(monday.getDate()).toBe(13);
    });

    it('понедельник для понедельника = тот же день', () => {
      const mon = new Date('2026-04-13');
      mon.setHours(15, 30);
      const result = startOfWeek(mon);
      expect(result.getDate()).toBe(13);
      expect(result.getHours()).toBe(0);
    });

    it('endOfWeek = воскресенье 23:59', () => {
      const wed = new Date('2026-04-15');
      const end = endOfWeek(wed);
      expect(end.getDay()).toBe(0); // Sunday
      expect(end.getHours()).toBe(23);
    });
  });

  describe('daysAgo', () => {
    it('возвращает дату в прошлом', () => {
      const before = daysAgo(7);
      const diff = (Date.now() - before.getTime()) / (1000 * 60 * 60 * 24);
      // setHours(0,0,0,0) → diff в диапазоне [7..8) дней
      expect(diff).toBeGreaterThanOrEqual(7);
      expect(diff).toBeLessThan(8);
    });
  });

  describe('generateWeeklyInsights', () => {
    const baseCtx = {
      e1rmDelta: 0,
      newPRs: 0,
      consistencyPct: 80,
      avgRIR: 2.5,
      avgSessionRPE: 7,
      sleepHoursAvg: 7.5,
      weightDeltaKg: 0,
      bodyweightGoal: 'maintain' as const,
    };

    it('возвращает ровно 3 инсайта', () => {
      const insights = generateWeeklyInsights(baseCtx);
      expect(insights).toHaveLength(3);
      expect(insights.map((i) => i.category)).toEqual([
        'improvement',
        'blocker',
        'recommendation',
      ]);
    });

    it('improvement: новые PR', () => {
      const insights = generateWeeklyInsights({ ...baseCtx, newPRs: 2 });
      expect(insights[0].title).toMatch(/Новые рекорды/);
    });

    it('blocker: низкая регулярность', () => {
      const insights = generateWeeklyInsights({ ...baseCtx, consistencyPct: 30 });
      expect(insights[1].title).toMatch(/регулярн/i);
    });

    it('blocker: перегруз по session-RPE', () => {
      const insights = generateWeeklyInsights({ ...baseCtx, avgSessionRPE: 9.5 });
      expect(insights[1].title).toMatch(/перегруз/i);
    });

    it('blocker: низкий RIR', () => {
      const insights = generateWeeklyInsights({ ...baseCtx, avgRIR: 0.5 });
      expect(insights[1].title).toMatch(/RIR/);
    });

    it('recommendation: делoad при перегрузе', () => {
      const insights = generateWeeklyInsights({ ...baseCtx, avgSessionRPE: 9.5 });
      expect(insights[2].title).toMatch(/делoad/i);
    });

    it('recommendation: готов к прибавке при росте + хорошем RIR', () => {
      const insights = generateWeeklyInsights({
        ...baseCtx,
        e1rmDelta: 2,
        avgRIR: 2.5,
      });
      expect(insights[2].title).toMatch(/прибавке/i);
    });

    it('improvement: вес снижается на cut в нормальном темпе', () => {
      const insights = generateWeeklyInsights({
        ...baseCtx,
        bodyweightGoal: 'cut',
        weightDeltaKg: -0.5,
      });
      expect(insights[0].message).toMatch(/безопасном/);
    });
  });
});
