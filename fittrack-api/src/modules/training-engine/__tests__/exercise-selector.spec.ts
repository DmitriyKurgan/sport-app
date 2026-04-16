import { EquipmentAccess, ExperienceLevel, InjuryFlag } from '../../profile/enums';
import { ExerciseRole, MovementPattern } from '../enums';
import {
  filterEligible,
  selectExercisesForPatterns,
} from '../generators/exercise-selector';
import { makeCatalog, makeProfile } from './fixtures';

describe('exercise-selector', () => {
  const catalog = makeCatalog();

  describe('filterEligible', () => {
    it('bodyweight-only профиль видит только bodyweight упражнения', () => {
      const profile = makeProfile({ equipmentAccess: EquipmentAccess.BODYWEIGHT });
      const eligible = filterEligible(catalog, profile, new Set());
      expect(eligible.every((e) => e.equipmentAccessMin === EquipmentAccess.BODYWEIGHT)).toBe(
        true,
      );
    });

    it('gym профиль видит всё вплоть до GYM', () => {
      const profile = makeProfile({ equipmentAccess: EquipmentAccess.GYM });
      const eligible = filterEligible(catalog, profile, new Set());
      // видит bodyweight, home_dumbbells, gym
      expect(eligible.some((e) => e.equipmentAccessMin === EquipmentAccess.GYM)).toBe(true);
    });

    it('injury знее исключает squat/lunge', () => {
      const profile = makeProfile({ injuryPainFlags: [InjuryFlag.KNEE] });
      const eligible = filterEligible(catalog, profile, new Set());
      const slugs = eligible.map((e) => e.slug);
      expect(slugs).not.toContain('bodyweight_squat');
      expect(slugs).not.toContain('goblet_squat');
      expect(slugs).not.toContain('back_squat');
      expect(slugs).not.toContain('forward_lunge');
    });

    it('novice не видит difficulty > 3', () => {
      const profile = makeProfile({ experienceLevel: ExperienceLevel.NOVICE });
      const eligible = filterEligible(catalog, profile, new Set());
      expect(eligible.every((e) => e.difficulty <= 3)).toBe(true);
    });

    it('intermediate видит difficulty 1-5', () => {
      const profile = makeProfile({ experienceLevel: ExperienceLevel.INTERMEDIATE });
      const eligible = filterEligible(catalog, profile, new Set());
      expect(eligible.some((e) => e.difficulty >= 4)).toBe(true);
    });

    it('excludeSlugs убирает указанные', () => {
      const profile = makeProfile();
      const eligible = filterEligible(catalog, profile, new Set(['bench_press']));
      expect(eligible.map((e) => e.slug)).not.toContain('bench_press');
    });

    it('bodyweightOnly фильтрует только bodyweight упражнения', () => {
      const profile = makeProfile({ equipmentAccess: EquipmentAccess.GYM });
      const eligible = filterEligible(catalog, profile, new Set(), true);
      expect(eligible.every((e) => e.equipmentRequired.includes('bodyweight'))).toBe(true);
    });
  });

  describe('selectExercisesForPatterns', () => {
    it('для main_lift у intermediate+gym выбирает back_squat вместо bodyweight', () => {
      const profile = makeProfile({
        equipmentAccess: EquipmentAccess.GYM,
        experienceLevel: ExperienceLevel.INTERMEDIATE,
      });
      const result = selectExercisesForPatterns({
        patterns: [MovementPattern.SQUAT],
        catalog,
        profile,
        role: ExerciseRole.MAIN_LIFT,
      });
      expect(result).toHaveLength(1);
      expect(result[0].exercise.slug).toBe('back_squat');
    });

    it('для novice+gym для SQUAT выбирает goblet_squat (проще)', () => {
      const profile = makeProfile({
        equipmentAccess: EquipmentAccess.GYM,
        experienceLevel: ExperienceLevel.NOVICE,
      });
      const result = selectExercisesForPatterns({
        patterns: [MovementPattern.SQUAT],
        catalog,
        profile,
        role: ExerciseRole.MAIN_LIFT,
      });
      expect(result[0].exercise.slug).toBe('goblet_squat');
    });

    it('для bodyweight профиля SQUAT → bodyweight_squat', () => {
      const profile = makeProfile({ equipmentAccess: EquipmentAccess.BODYWEIGHT });
      const result = selectExercisesForPatterns({
        patterns: [MovementPattern.SQUAT],
        catalog,
        profile,
        role: ExerciseRole.MAIN_LIFT,
      });
      expect(result[0].exercise.slug).toBe('bodyweight_squat');
    });

    it('не дублирует упражнение при нескольких одинаковых patterns', () => {
      const profile = makeProfile({ equipmentAccess: EquipmentAccess.BODYWEIGHT });
      const result = selectExercisesForPatterns({
        patterns: [MovementPattern.CORE, MovementPattern.CORE],
        catalog,
        profile,
        role: ExerciseRole.ACCESSORY,
      });
      // Во второй раз CORE уже использован — второй элемент может быть пропущен
      const slugs = result.map((r) => r.exercise.slug);
      expect(new Set(slugs).size).toBe(slugs.length); // уникальны
    });

    it('для пустого каталога возвращает []', () => {
      const result = selectExercisesForPatterns({
        patterns: [MovementPattern.SQUAT],
        catalog: [],
        profile: makeProfile(),
        role: ExerciseRole.MAIN_LIFT,
      });
      expect(result).toEqual([]);
    });
  });
});
