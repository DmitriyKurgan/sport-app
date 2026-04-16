import {
  EquipmentAccess,
  ExperienceLevel,
  StressLevel,
} from '../../profile/enums';
import { ProgramPhase, SplitType } from '../enums';
import { generateProgram, resolveDaysTarget } from '../generators/program-generator';
import { makeCatalog, makeProfile } from './fixtures';

describe('program-generator (integration)', () => {
  const catalog = makeCatalog();

  describe('resolveDaysTarget (safeguards)', () => {
    it('novice cap: 6 запросил → 4 дня', () => {
      const days = resolveDaysTarget(
        makeProfile({
          experienceLevel: ExperienceLevel.NOVICE,
          weeklyTrainingDaysTarget: 6,
        }),
      );
      expect(days).toBe(4);
    });

    it('none cap: 5 запросил → 3 дня', () => {
      const days = resolveDaysTarget(
        makeProfile({
          experienceLevel: ExperienceLevel.NONE,
          weeklyTrainingDaysTarget: 5,
        }),
      );
      expect(days).toBe(3);
    });

    it('6 дней + stress=high → fallback 4', () => {
      const days = resolveDaysTarget(
        makeProfile({
          experienceLevel: ExperienceLevel.INTERMEDIATE,
          weeklyTrainingDaysTarget: 6,
          stressLevel: StressLevel.HIGH,
        }),
      );
      expect(days).toBe(4);
    });

    it('6 дней + sleep < 7 → fallback 4', () => {
      const days = resolveDaysTarget(
        makeProfile({
          experienceLevel: ExperienceLevel.INTERMEDIATE,
          weeklyTrainingDaysTarget: 6,
          sleepHoursAvg: 6.5,
        }),
      );
      expect(days).toBe(4);
    });

    it('6 дней + sleep ≥ 7 + stress ≠ high → разрешено 6', () => {
      const days = resolveDaysTarget(
        makeProfile({
          experienceLevel: ExperienceLevel.INTERMEDIATE,
          weeklyTrainingDaysTarget: 6,
          sleepHoursAvg: 8,
          stressLevel: StressLevel.LOW,
        }),
      );
      expect(days).toBe(6);
    });

    it('минимум 2 дня', () => {
      const days = resolveDaysTarget(makeProfile({ weeklyTrainingDaysTarget: 1 }));
      expect(days).toBe(2);
    });
  });

  describe('generateProgram: базовые проверки', () => {
    it('создаёт 12 недель', () => {
      const program = generateProgram(makeProfile(), catalog);
      expect(program.totalWeeks).toBe(12);
      expect(program.weeks).toHaveLength(12);
    });

    it('фазы расставлены корректно (4, 8, 12 = deload)', () => {
      const program = generateProgram(makeProfile(), catalog);
      expect(program.weeks[3].phase).toBe(ProgramPhase.DELOAD); // week 4
      expect(program.weeks[7].phase).toBe(ProgramPhase.DELOAD); // week 8
      expect(program.weeks[11].phase).toBe(ProgramPhase.DELOAD); // week 12
      expect(program.weeks[3].isDeload).toBe(true);
    });

    it('мезоциклы 1-4, 5-8, 9-12', () => {
      const program = generateProgram(makeProfile(), catalog);
      expect(program.weeks[0].mesocycleNumber).toBe(1);
      expect(program.weeks[4].mesocycleNumber).toBe(2);
      expect(program.weeks[8].mesocycleNumber).toBe(3);
    });

    it('4 дня → split upper_lower', () => {
      const program = generateProgram(makeProfile({ weeklyTrainingDaysTarget: 4 }), catalog);
      expect(program.splitType).toBe(SplitType.UPPER_LOWER);
      expect(program.weeks[0].days).toHaveLength(4);
    });

    it('3 дня → full_body', () => {
      const program = generateProgram(makeProfile({ weeklyTrainingDaysTarget: 3 }), catalog);
      expect(program.splitType).toBe(SplitType.FULL_BODY);
      expect(program.weeks[0].days).toHaveLength(3);
    });

    it('6 дней + good recovery → PPL', () => {
      const program = generateProgram(
        makeProfile({
          weeklyTrainingDaysTarget: 6,
          sleepHoursAvg: 8,
          stressLevel: StressLevel.LOW,
        }),
        catalog,
      );
      expect(program.splitType).toBe(SplitType.PPL);
      expect(program.weeks[0].days).toHaveLength(6);
    });

    it('у каждого дня есть упражнения', () => {
      const program = generateProgram(makeProfile(), catalog);
      for (const week of program.weeks) {
        for (const day of week.days) {
          expect(day.exercises.length).toBeGreaterThan(0);
        }
      }
    });

    it('упражнения в одном дне уникальны (не дублируются)', () => {
      const program = generateProgram(makeProfile(), catalog);
      for (const day of program.weeks[0].days) {
        const slugs = day.exercises.map((e) => e.exerciseSlug);
        expect(new Set(slugs).size).toBe(slugs.length);
      }
    });

    it('main lifts стабильны внутри мезоцикла 1 (нед 1-3)', () => {
      const program = generateProgram(makeProfile(), catalog);
      const mainLiftsWeek1 = program.weeks[0].days[0].exercises
        .filter((e) => e.role === 'main_lift')
        .map((e) => e.exerciseSlug);
      const mainLiftsWeek3 = program.weeks[2].days[0].exercises
        .filter((e) => e.role === 'main_lift')
        .map((e) => e.exerciseSlug);
      expect(mainLiftsWeek1).toEqual(mainLiftsWeek3);
    });

    it('bodyweight профиль → все упражнения bodyweight-совместимы', () => {
      const program = generateProgram(
        makeProfile({ equipmentAccess: EquipmentAccess.BODYWEIGHT }),
        catalog,
      );
      for (const day of program.weeks[0].days) {
        for (const ex of day.exercises) {
          const catalogItem = catalog.find((c) => c.slug === ex.exerciseSlug)!;
          expect(catalogItem.equipmentAccessMin).toBe(EquipmentAccess.BODYWEIGHT);
        }
      }
    });

    it('deload неделя имеет меньший volumeModifier', () => {
      const program = generateProgram(makeProfile(), catalog);
      const week1VolMod = program.weeks[0].volumeModifier;
      const week4VolMod = program.weeks[3].volumeModifier;
      expect(week4VolMod).toBeLessThan(week1VolMod);
    });

    it('ни одно упражнение не противоречит травмам', () => {
      const program = generateProgram(
        makeProfile({ injuryPainFlags: ['shoulder', 'knee'] as any }),
        catalog,
      );
      for (const day of program.weeks[0].days) {
        for (const ex of day.exercises) {
          const catalogItem = catalog.find((c) => c.slug === ex.exerciseSlug)!;
          expect(catalogItem.contraindications).not.toContain('shoulder');
          expect(catalogItem.contraindications).not.toContain('knee');
        }
      }
    });
  });

  describe('generateProgram: red flags → LOW_INTENSITY', () => {
    it('preScreeningRedFlags → isLowIntensityMode=true', () => {
      const program = generateProgram(
        makeProfile({ preScreeningRedFlags: true }),
        catalog,
      );
      expect(program.isLowIntensityMode).toBe(true);
      expect(program.splitType).toBe(SplitType.LOW_INTENSITY);
      expect(program.weeklyDays).toBe(3);
    });

    it('LOW_INTENSITY использует только bodyweight', () => {
      const program = generateProgram(
        makeProfile({ preScreeningRedFlags: true, equipmentAccess: EquipmentAccess.GYM }),
        catalog,
      );
      for (const day of program.weeks[0].days) {
        for (const ex of day.exercises) {
          const catalogItem = catalog.find((c) => c.slug === ex.exerciseSlug)!;
          expect(catalogItem.equipmentRequired).toContain('bodyweight');
        }
      }
    });

    it('LOW_INTENSITY всё равно имеет 12 недель с фазами', () => {
      const program = generateProgram(
        makeProfile({ preScreeningRedFlags: true }),
        catalog,
      );
      expect(program.weeks).toHaveLength(12);
      expect(program.weeks[3].isDeload).toBe(true);
    });
  });

  describe('lifestyle adjustments', () => {
    it('sedentary + week 1 → меньше упражнений (нет accessories)', () => {
      const sedentaryProgram = generateProgram(
        makeProfile({ dailyActivityLevel: 'sedentary' as any }),
        catalog,
      );
      const activeProgram = generateProgram(
        makeProfile({ dailyActivityLevel: 'active' as any }),
        catalog,
      );
      // Week 1, первый день
      expect(sedentaryProgram.weeks[0].days[0].exercises.length).toBeLessThan(
        activeProgram.weeks[0].days[0].exercises.length,
      );
      // Week 5 — accessories возвращаются
      expect(sedentaryProgram.weeks[4].days[0].exercises.length).toBeGreaterThan(0);
    });
  });
});
