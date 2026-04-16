import {
  BodyweightGoal,
  DailyActivityLevel,
  EquipmentAccess,
  ExperienceLevel,
  Gender,
  InjuryFlag,
  NutritionTier,
  PrimaryTrainingGoal,
  StressLevel,
} from '../../profile/enums';
import {
  JointInvolvement,
  MovementPattern,
  MuscleGroup,
} from '../enums';
import { ExerciseCatalogItem, ProfileConfig } from '../interfaces';

/**
 * Фикстуры для тестов — минимальный каталог и профили.
 */

export function makeProfile(overrides: Partial<ProfileConfig> = {}): ProfileConfig {
  return {
    sex: Gender.MALE,
    ageYears: 28,
    heightCm: 180,
    weightKg: 80,
    experienceLevel: ExperienceLevel.INTERMEDIATE,
    currentTrainingDaysPerWeek: 3,
    primaryTrainingGoal: PrimaryTrainingGoal.HYPERTROPHY,
    bodyweightGoal: BodyweightGoal.MAINTAIN,
    weeklyTrainingDaysTarget: 4,
    sessionDurationMinutes: 60,
    equipmentAccess: EquipmentAccess.GYM,
    injuryPainFlags: [],
    preScreeningRedFlags: false,
    sleepHoursAvg: 7.5,
    stressLevel: StressLevel.LOW,
    dailyActivityLevel: DailyActivityLevel.MODERATE,
    ...overrides,
  };
}

/**
 * Мини-каталог: хотя бы по 1 упражнению на каждый нужный pattern,
 * с разными equipmentAccessMin и contraindications.
 */
export function makeCatalog(): ExerciseCatalogItem[] {
  const mk = (p: Partial<ExerciseCatalogItem> & Pick<ExerciseCatalogItem, 'id' | 'slug' | 'name' | 'movementPatterns' | 'equipmentAccessMin'>): ExerciseCatalogItem => ({
    nameRu: null,
    primaryMuscles: [],
    secondaryMuscles: [],
    jointInvolvement: [],
    contraindications: [],
    equipmentRequired: ['bodyweight'],
    difficulty: 2,
    technicalDemand: 'medium',
    progressionChain: null,
    progressionOrder: null,
    ...p,
  }) as ExerciseCatalogItem;

  return [
    // SQUAT
    mk({
      id: '1', slug: 'bodyweight_squat', name: 'Bodyweight Squat',
      movementPatterns: [MovementPattern.SQUAT],
      primaryMuscles: [MuscleGroup.QUADRICEPS, MuscleGroup.GLUTES],
      jointInvolvement: [JointInvolvement.KNEE, JointInvolvement.HIP],
      contraindications: [InjuryFlag.KNEE],
      equipmentRequired: ['bodyweight'],
      equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
      difficulty: 1, technicalDemand: 'low',
      progressionChain: ['bodyweight_squat', 'goblet_squat', 'back_squat'],
      progressionOrder: 1,
    }),
    mk({
      id: '2', slug: 'goblet_squat', name: 'Goblet Squat',
      movementPatterns: [MovementPattern.SQUAT],
      primaryMuscles: [MuscleGroup.QUADRICEPS],
      jointInvolvement: [JointInvolvement.KNEE, JointInvolvement.HIP],
      contraindications: [InjuryFlag.KNEE],
      equipmentRequired: ['dumbbells'],
      equipmentAccessMin: EquipmentAccess.HOME_DUMBBELLS,
      difficulty: 2, technicalDemand: 'low',
      progressionChain: ['bodyweight_squat', 'goblet_squat', 'back_squat'],
      progressionOrder: 2,
    }),
    mk({
      id: '3', slug: 'back_squat', name: 'Back Squat',
      movementPatterns: [MovementPattern.SQUAT],
      primaryMuscles: [MuscleGroup.QUADRICEPS, MuscleGroup.GLUTES],
      jointInvolvement: [JointInvolvement.KNEE, JointInvolvement.HIP, JointInvolvement.SPINE],
      contraindications: [InjuryFlag.KNEE, InjuryFlag.LOWER_BACK],
      equipmentRequired: ['barbell'],
      equipmentAccessMin: EquipmentAccess.GYM,
      difficulty: 4, technicalDemand: 'high',
      progressionChain: ['bodyweight_squat', 'goblet_squat', 'back_squat'],
      progressionOrder: 3,
    }),
    // HINGE
    mk({
      id: '4', slug: 'hip_thrust', name: 'Hip Thrust',
      movementPatterns: [MovementPattern.HINGE],
      primaryMuscles: [MuscleGroup.GLUTES],
      jointInvolvement: [JointInvolvement.HIP],
      contraindications: [],
      equipmentRequired: ['bodyweight'],
      equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
      difficulty: 2, technicalDemand: 'low',
    }),
    mk({
      id: '5', slug: 'deadlift', name: 'Deadlift',
      movementPatterns: [MovementPattern.HINGE],
      primaryMuscles: [MuscleGroup.HAMSTRINGS, MuscleGroup.GLUTES],
      jointInvolvement: [JointInvolvement.HIP, JointInvolvement.SPINE],
      contraindications: [InjuryFlag.LOWER_BACK],
      equipmentRequired: ['barbell'],
      equipmentAccessMin: EquipmentAccess.GYM,
      difficulty: 4, technicalDemand: 'high',
    }),
    // HORIZONTAL_PUSH
    mk({
      id: '6', slug: 'pushup', name: 'Push-up',
      movementPatterns: [MovementPattern.HORIZONTAL_PUSH],
      primaryMuscles: [MuscleGroup.CHEST],
      jointInvolvement: [JointInvolvement.SHOULDER],
      contraindications: [InjuryFlag.SHOULDER, InjuryFlag.WRIST],
      equipmentRequired: ['bodyweight'],
      equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
      difficulty: 2, technicalDemand: 'low',
      progressionChain: ['knee_pushup', 'pushup', 'bench_press'],
      progressionOrder: 2,
    }),
    mk({
      id: '7', slug: 'bench_press', name: 'Bench Press',
      movementPatterns: [MovementPattern.HORIZONTAL_PUSH],
      primaryMuscles: [MuscleGroup.CHEST],
      jointInvolvement: [JointInvolvement.SHOULDER],
      contraindications: [InjuryFlag.SHOULDER],
      equipmentRequired: ['barbell'],
      equipmentAccessMin: EquipmentAccess.GYM,
      difficulty: 3, technicalDemand: 'medium',
      progressionChain: ['knee_pushup', 'pushup', 'bench_press'],
      progressionOrder: 3,
    }),
    // HORIZONTAL_PULL
    mk({
      id: '8', slug: 'inverted_row', name: 'Inverted Row',
      movementPatterns: [MovementPattern.HORIZONTAL_PULL],
      primaryMuscles: [MuscleGroup.BACK],
      jointInvolvement: [JointInvolvement.SHOULDER],
      contraindications: [InjuryFlag.SHOULDER],
      equipmentRequired: ['bodyweight'],
      equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
      difficulty: 2, technicalDemand: 'low',
    }),
    mk({
      id: '9', slug: 'barbell_row', name: 'Barbell Row',
      movementPatterns: [MovementPattern.HORIZONTAL_PULL],
      primaryMuscles: [MuscleGroup.BACK],
      jointInvolvement: [JointInvolvement.SHOULDER, JointInvolvement.SPINE],
      contraindications: [InjuryFlag.LOWER_BACK],
      equipmentRequired: ['barbell'],
      equipmentAccessMin: EquipmentAccess.GYM,
      difficulty: 3, technicalDemand: 'medium',
    }),
    // VERTICAL_PUSH
    mk({
      id: '10', slug: 'pike_pushup', name: 'Pike Push-up',
      movementPatterns: [MovementPattern.VERTICAL_PUSH],
      primaryMuscles: [MuscleGroup.SHOULDERS],
      jointInvolvement: [JointInvolvement.SHOULDER],
      contraindications: [InjuryFlag.SHOULDER],
      equipmentRequired: ['bodyweight'],
      equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
      difficulty: 2, technicalDemand: 'low',
    }),
    mk({
      id: '11', slug: 'overhead_press', name: 'Overhead Press',
      movementPatterns: [MovementPattern.VERTICAL_PUSH],
      primaryMuscles: [MuscleGroup.SHOULDERS],
      jointInvolvement: [JointInvolvement.SHOULDER],
      contraindications: [InjuryFlag.SHOULDER],
      equipmentRequired: ['barbell'],
      equipmentAccessMin: EquipmentAccess.GYM,
      difficulty: 3, technicalDemand: 'medium',
    }),
    // VERTICAL_PULL
    mk({
      id: '12', slug: 'assisted_pullup', name: 'Assisted Pull-up',
      movementPatterns: [MovementPattern.VERTICAL_PULL],
      primaryMuscles: [MuscleGroup.LATS],
      jointInvolvement: [JointInvolvement.SHOULDER],
      contraindications: [InjuryFlag.SHOULDER],
      equipmentRequired: ['bodyweight'],
      equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
      difficulty: 2, technicalDemand: 'low',
    }),
    // CORE
    mk({
      id: '13', slug: 'plank', name: 'Plank',
      movementPatterns: [MovementPattern.CORE],
      primaryMuscles: [MuscleGroup.ABS],
      jointInvolvement: [JointInvolvement.SPINE],
      contraindications: [],
      equipmentRequired: ['bodyweight'],
      equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
      difficulty: 1, technicalDemand: 'low',
    }),
    // LUNGE
    mk({
      id: '14', slug: 'forward_lunge', name: 'Forward Lunge',
      movementPatterns: [MovementPattern.LUNGE],
      primaryMuscles: [MuscleGroup.QUADRICEPS, MuscleGroup.GLUTES],
      jointInvolvement: [JointInvolvement.KNEE],
      contraindications: [InjuryFlag.KNEE],
      equipmentRequired: ['bodyweight'],
      equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
      difficulty: 2, technicalDemand: 'medium',
    }),
    // ISOLATION
    mk({
      id: '15', slug: 'biceps_curl', name: 'Biceps Curl',
      movementPatterns: [MovementPattern.ISOLATION],
      primaryMuscles: [MuscleGroup.BICEPS],
      jointInvolvement: [],
      contraindications: [],
      equipmentRequired: ['dumbbells'],
      equipmentAccessMin: EquipmentAccess.HOME_DUMBBELLS,
      difficulty: 1, technicalDemand: 'low',
    }),
    mk({
      id: '16', slug: 'triceps_extension', name: 'Triceps Extension',
      movementPatterns: [MovementPattern.ISOLATION],
      primaryMuscles: [MuscleGroup.TRICEPS],
      jointInvolvement: [],
      contraindications: [],
      equipmentRequired: ['dumbbells'],
      equipmentAccessMin: EquipmentAccess.HOME_DUMBBELLS,
      difficulty: 1, technicalDemand: 'low',
    }),
    mk({
      id: '17', slug: 'lateral_raise', name: 'Lateral Raise',
      movementPatterns: [MovementPattern.ISOLATION],
      primaryMuscles: [MuscleGroup.SHOULDERS],
      jointInvolvement: [JointInvolvement.SHOULDER],
      contraindications: [InjuryFlag.SHOULDER],
      equipmentRequired: ['dumbbells'],
      equipmentAccessMin: EquipmentAccess.HOME_DUMBBELLS,
      difficulty: 1, technicalDemand: 'low',
    }),
  ];
}
