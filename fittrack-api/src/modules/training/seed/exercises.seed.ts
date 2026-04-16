/**
 * Seed-каталог упражнений для TrainingEngine.
 * Минимум 40 упражнений, покрывающих все movement patterns.
 *
 * Источник правил покрытия и progression chains: implementation.md § 7.4.
 */
import { EquipmentAccess, InjuryFlag } from '../../profile/enums';
import {
  JointInvolvement as J,
  MovementPattern as P,
  MuscleGroup as M,
} from '../../training-engine/enums';

export interface ExerciseSeedData {
  slug: string;
  name: string;
  nameRu: string;
  description?: string;
  movementPatterns: P[];
  primaryMuscles: M[];
  secondaryMuscles?: M[];
  jointInvolvement: J[];
  contraindications?: InjuryFlag[];
  equipmentRequired: string[];
  equipmentAccessMin: EquipmentAccess;
  difficulty: 1 | 2 | 3 | 4 | 5;
  technicalDemand: 'low' | 'medium' | 'high';
  progressionChain?: string[];
  progressionOrder?: number;
}

// === Progression chains ===
const PUSH_CHAIN = ['knee_pushup', 'pushup', 'bench_press', 'barbell_bench_press'];
const SQUAT_CHAIN = ['bodyweight_squat', 'goblet_squat', 'front_squat', 'back_squat'];
const PULL_CHAIN = ['inverted_row', 'assisted_pullup', 'pullup', 'weighted_pullup'];

export const EXERCISES_SEED: ExerciseSeedData[] = [
  // ============= SQUAT =============
  {
    slug: 'bodyweight_squat', name: 'Bodyweight Squat', nameRu: 'Приседания без отягощений',
    movementPatterns: [P.SQUAT],
    primaryMuscles: [M.QUADRICEPS, M.GLUTES], secondaryMuscles: [M.HAMSTRINGS],
    jointInvolvement: [J.KNEE, J.HIP],
    contraindications: [InjuryFlag.KNEE],
    equipmentRequired: ['bodyweight'], equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
    difficulty: 1, technicalDemand: 'low',
    progressionChain: SQUAT_CHAIN, progressionOrder: 1,
  },
  {
    slug: 'goblet_squat', name: 'Goblet Squat', nameRu: 'Присед с гирей у груди',
    movementPatterns: [P.SQUAT],
    primaryMuscles: [M.QUADRICEPS, M.GLUTES], secondaryMuscles: [M.ABS],
    jointInvolvement: [J.KNEE, J.HIP],
    contraindications: [InjuryFlag.KNEE],
    equipmentRequired: ['dumbbells'], equipmentAccessMin: EquipmentAccess.HOME_DUMBBELLS,
    difficulty: 2, technicalDemand: 'low',
    progressionChain: SQUAT_CHAIN, progressionOrder: 2,
  },
  {
    slug: 'front_squat', name: 'Front Squat', nameRu: 'Фронтальный присед',
    movementPatterns: [P.SQUAT],
    primaryMuscles: [M.QUADRICEPS, M.GLUTES], secondaryMuscles: [M.ABS, M.TRAPS],
    jointInvolvement: [J.KNEE, J.HIP, J.SPINE, J.WRIST],
    contraindications: [InjuryFlag.KNEE, InjuryFlag.WRIST],
    equipmentRequired: ['barbell'], equipmentAccessMin: EquipmentAccess.GYM,
    difficulty: 3, technicalDemand: 'high',
    progressionChain: SQUAT_CHAIN, progressionOrder: 3,
  },
  {
    slug: 'back_squat', name: 'Back Squat', nameRu: 'Присед со штангой на спине',
    movementPatterns: [P.SQUAT],
    primaryMuscles: [M.QUADRICEPS, M.GLUTES], secondaryMuscles: [M.HAMSTRINGS, M.ABS],
    jointInvolvement: [J.KNEE, J.HIP, J.SPINE],
    contraindications: [InjuryFlag.KNEE, InjuryFlag.LOWER_BACK],
    equipmentRequired: ['barbell', 'rack'], equipmentAccessMin: EquipmentAccess.GYM,
    difficulty: 4, technicalDemand: 'high',
    progressionChain: SQUAT_CHAIN, progressionOrder: 4,
  },
  {
    slug: 'bulgarian_split_squat', name: 'Bulgarian Split Squat', nameRu: 'Болгарские сплит-приседы',
    movementPatterns: [P.SQUAT, P.LUNGE],
    primaryMuscles: [M.QUADRICEPS, M.GLUTES],
    jointInvolvement: [J.KNEE, J.HIP],
    contraindications: [InjuryFlag.KNEE],
    equipmentRequired: ['bodyweight'], equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
    difficulty: 3, technicalDemand: 'medium',
  },
  {
    slug: 'leg_press', name: 'Leg Press', nameRu: 'Жим ногами',
    movementPatterns: [P.SQUAT],
    primaryMuscles: [M.QUADRICEPS, M.GLUTES],
    jointInvolvement: [J.KNEE, J.HIP],
    contraindications: [InjuryFlag.KNEE],
    equipmentRequired: ['machine'], equipmentAccessMin: EquipmentAccess.GYM,
    difficulty: 2, technicalDemand: 'low',
  },

  // ============= HINGE =============
  {
    slug: 'hip_thrust', name: 'Hip Thrust', nameRu: 'Ягодичный мост (Hip Thrust)',
    movementPatterns: [P.HINGE],
    primaryMuscles: [M.GLUTES], secondaryMuscles: [M.HAMSTRINGS],
    jointInvolvement: [J.HIP],
    equipmentRequired: ['bodyweight'], equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
    difficulty: 2, technicalDemand: 'low',
  },
  {
    slug: 'rdl', name: 'Romanian Deadlift', nameRu: 'Румынская тяга',
    movementPatterns: [P.HINGE],
    primaryMuscles: [M.HAMSTRINGS, M.GLUTES], secondaryMuscles: [M.BACK],
    jointInvolvement: [J.HIP, J.SPINE],
    contraindications: [InjuryFlag.LOWER_BACK],
    equipmentRequired: ['barbell'], equipmentAccessMin: EquipmentAccess.GYM,
    difficulty: 3, technicalDemand: 'medium',
  },
  {
    slug: 'deadlift', name: 'Deadlift', nameRu: 'Становая тяга',
    movementPatterns: [P.HINGE],
    primaryMuscles: [M.HAMSTRINGS, M.GLUTES, M.BACK], secondaryMuscles: [M.TRAPS, M.FOREARMS],
    jointInvolvement: [J.HIP, J.SPINE, J.KNEE],
    contraindications: [InjuryFlag.LOWER_BACK],
    equipmentRequired: ['barbell'], equipmentAccessMin: EquipmentAccess.GYM,
    difficulty: 4, technicalDemand: 'high',
  },
  {
    slug: 'kettlebell_swing', name: 'Kettlebell Swing', nameRu: 'Махи гирей',
    movementPatterns: [P.HINGE],
    primaryMuscles: [M.GLUTES, M.HAMSTRINGS], secondaryMuscles: [M.BACK, M.ABS],
    jointInvolvement: [J.HIP, J.SPINE],
    contraindications: [InjuryFlag.LOWER_BACK],
    equipmentRequired: ['kettlebell'], equipmentAccessMin: EquipmentAccess.HOME_DUMBBELLS,
    difficulty: 3, technicalDemand: 'medium',
  },
  {
    slug: 'good_morning', name: 'Good Morning', nameRu: 'Good Morning (наклоны со штангой)',
    movementPatterns: [P.HINGE],
    primaryMuscles: [M.HAMSTRINGS, M.BACK], secondaryMuscles: [M.GLUTES],
    jointInvolvement: [J.HIP, J.SPINE],
    contraindications: [InjuryFlag.LOWER_BACK],
    equipmentRequired: ['barbell'], equipmentAccessMin: EquipmentAccess.GYM,
    difficulty: 4, technicalDemand: 'high',
  },

  // ============= HORIZONTAL_PUSH =============
  {
    slug: 'knee_pushup', name: 'Knee Push-up', nameRu: 'Отжимания с колен',
    movementPatterns: [P.HORIZONTAL_PUSH],
    primaryMuscles: [M.CHEST, M.TRICEPS], secondaryMuscles: [M.SHOULDERS],
    jointInvolvement: [J.SHOULDER, J.WRIST],
    equipmentRequired: ['bodyweight'], equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
    difficulty: 1, technicalDemand: 'low',
    progressionChain: PUSH_CHAIN, progressionOrder: 1,
  },
  {
    slug: 'pushup', name: 'Push-up', nameRu: 'Классические отжимания',
    movementPatterns: [P.HORIZONTAL_PUSH],
    primaryMuscles: [M.CHEST, M.TRICEPS], secondaryMuscles: [M.SHOULDERS, M.ABS],
    jointInvolvement: [J.SHOULDER, J.WRIST],
    contraindications: [InjuryFlag.WRIST],
    equipmentRequired: ['bodyweight'], equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
    difficulty: 2, technicalDemand: 'low',
    progressionChain: PUSH_CHAIN, progressionOrder: 2,
  },
  {
    slug: 'dumbbell_bench_press', name: 'Dumbbell Bench Press', nameRu: 'Жим гантелей лёжа',
    movementPatterns: [P.HORIZONTAL_PUSH],
    primaryMuscles: [M.CHEST, M.TRICEPS], secondaryMuscles: [M.SHOULDERS],
    jointInvolvement: [J.SHOULDER],
    contraindications: [InjuryFlag.SHOULDER],
    equipmentRequired: ['dumbbells', 'bench'], equipmentAccessMin: EquipmentAccess.HOME_DUMBBELLS,
    difficulty: 2, technicalDemand: 'medium',
  },
  {
    slug: 'bench_press', name: 'Bench Press', nameRu: 'Жим штанги лёжа',
    movementPatterns: [P.HORIZONTAL_PUSH],
    primaryMuscles: [M.CHEST, M.TRICEPS], secondaryMuscles: [M.SHOULDERS],
    jointInvolvement: [J.SHOULDER],
    contraindications: [InjuryFlag.SHOULDER],
    equipmentRequired: ['barbell', 'bench'], equipmentAccessMin: EquipmentAccess.GYM,
    difficulty: 3, technicalDemand: 'medium',
    progressionChain: PUSH_CHAIN, progressionOrder: 3,
  },
  {
    slug: 'chest_press_machine', name: 'Chest Press Machine', nameRu: 'Жим в тренажёре',
    movementPatterns: [P.HORIZONTAL_PUSH],
    primaryMuscles: [M.CHEST, M.TRICEPS],
    jointInvolvement: [J.SHOULDER],
    equipmentRequired: ['machine'], equipmentAccessMin: EquipmentAccess.GYM,
    difficulty: 1, technicalDemand: 'low',
  },

  // ============= HORIZONTAL_PULL =============
  {
    slug: 'inverted_row', name: 'Inverted Row', nameRu: 'Австралийские подтягивания',
    movementPatterns: [P.HORIZONTAL_PULL],
    primaryMuscles: [M.BACK, M.BICEPS], secondaryMuscles: [M.SHOULDERS],
    jointInvolvement: [J.SHOULDER],
    equipmentRequired: ['bodyweight'], equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
    difficulty: 2, technicalDemand: 'low',
    progressionChain: PULL_CHAIN, progressionOrder: 1,
  },
  {
    slug: 'dumbbell_row', name: 'One-arm Dumbbell Row', nameRu: 'Тяга гантели в наклоне',
    movementPatterns: [P.HORIZONTAL_PULL],
    primaryMuscles: [M.BACK, M.BICEPS], secondaryMuscles: [M.TRAPS],
    jointInvolvement: [J.SHOULDER, J.SPINE],
    equipmentRequired: ['dumbbells', 'bench'], equipmentAccessMin: EquipmentAccess.HOME_DUMBBELLS,
    difficulty: 2, technicalDemand: 'medium',
  },
  {
    slug: 'bent_over_row', name: 'Bent-over Barbell Row', nameRu: 'Тяга штанги в наклоне',
    movementPatterns: [P.HORIZONTAL_PULL],
    primaryMuscles: [M.BACK, M.BICEPS], secondaryMuscles: [M.TRAPS, M.LATS],
    jointInvolvement: [J.SHOULDER, J.SPINE],
    contraindications: [InjuryFlag.LOWER_BACK],
    equipmentRequired: ['barbell'], equipmentAccessMin: EquipmentAccess.GYM,
    difficulty: 3, technicalDemand: 'medium',
  },
  {
    slug: 'cable_row', name: 'Seated Cable Row', nameRu: 'Горизонтальная тяга в блоке',
    movementPatterns: [P.HORIZONTAL_PULL],
    primaryMuscles: [M.BACK, M.BICEPS], secondaryMuscles: [M.LATS],
    jointInvolvement: [J.SHOULDER],
    equipmentRequired: ['cable'], equipmentAccessMin: EquipmentAccess.GYM,
    difficulty: 2, technicalDemand: 'low',
  },

  // ============= VERTICAL_PUSH =============
  {
    slug: 'pike_pushup', name: 'Pike Push-up', nameRu: 'Pike-отжимания (стойка-жим)',
    movementPatterns: [P.VERTICAL_PUSH],
    primaryMuscles: [M.SHOULDERS, M.TRICEPS],
    jointInvolvement: [J.SHOULDER, J.WRIST],
    contraindications: [InjuryFlag.SHOULDER, InjuryFlag.WRIST],
    equipmentRequired: ['bodyweight'], equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
    difficulty: 2, technicalDemand: 'medium',
  },
  {
    slug: 'dumbbell_shoulder_press', name: 'Dumbbell Shoulder Press', nameRu: 'Жим гантелей сидя',
    movementPatterns: [P.VERTICAL_PUSH],
    primaryMuscles: [M.SHOULDERS, M.TRICEPS],
    jointInvolvement: [J.SHOULDER],
    contraindications: [InjuryFlag.SHOULDER],
    equipmentRequired: ['dumbbells'], equipmentAccessMin: EquipmentAccess.HOME_DUMBBELLS,
    difficulty: 2, technicalDemand: 'medium',
  },
  {
    slug: 'overhead_press', name: 'Overhead Press (OHP)', nameRu: 'Армейский жим стоя',
    movementPatterns: [P.VERTICAL_PUSH],
    primaryMuscles: [M.SHOULDERS, M.TRICEPS], secondaryMuscles: [M.ABS, M.TRAPS],
    jointInvolvement: [J.SHOULDER, J.SPINE],
    contraindications: [InjuryFlag.SHOULDER, InjuryFlag.LOWER_BACK],
    equipmentRequired: ['barbell'], equipmentAccessMin: EquipmentAccess.GYM,
    difficulty: 3, technicalDemand: 'high',
  },
  {
    slug: 'seated_press_machine', name: 'Seated Press Machine', nameRu: 'Жим в тренажёре над головой',
    movementPatterns: [P.VERTICAL_PUSH],
    primaryMuscles: [M.SHOULDERS, M.TRICEPS],
    jointInvolvement: [J.SHOULDER],
    contraindications: [InjuryFlag.SHOULDER],
    equipmentRequired: ['machine'], equipmentAccessMin: EquipmentAccess.GYM,
    difficulty: 1, technicalDemand: 'low',
  },

  // ============= VERTICAL_PULL =============
  {
    slug: 'assisted_pullup', name: 'Assisted Pull-up', nameRu: 'Подтягивания с ассистом',
    movementPatterns: [P.VERTICAL_PULL],
    primaryMuscles: [M.LATS, M.BICEPS], secondaryMuscles: [M.BACK],
    jointInvolvement: [J.SHOULDER],
    contraindications: [InjuryFlag.SHOULDER],
    equipmentRequired: ['bar', 'band'], equipmentAccessMin: EquipmentAccess.HOME_DUMBBELLS,
    difficulty: 2, technicalDemand: 'low',
    progressionChain: PULL_CHAIN, progressionOrder: 2,
  },
  {
    slug: 'pullup', name: 'Pull-up', nameRu: 'Классические подтягивания',
    movementPatterns: [P.VERTICAL_PULL],
    primaryMuscles: [M.LATS, M.BICEPS], secondaryMuscles: [M.BACK, M.FOREARMS],
    jointInvolvement: [J.SHOULDER],
    contraindications: [InjuryFlag.SHOULDER],
    equipmentRequired: ['bar'], equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
    difficulty: 3, technicalDemand: 'medium',
    progressionChain: PULL_CHAIN, progressionOrder: 3,
  },
  {
    slug: 'chin_up', name: 'Chin-up', nameRu: 'Подтягивания обратным хватом',
    movementPatterns: [P.VERTICAL_PULL],
    primaryMuscles: [M.LATS, M.BICEPS],
    jointInvolvement: [J.SHOULDER],
    contraindications: [InjuryFlag.SHOULDER],
    equipmentRequired: ['bar'], equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
    difficulty: 3, technicalDemand: 'medium',
  },
  {
    slug: 'lat_pulldown', name: 'Lat Pulldown', nameRu: 'Тяга верхнего блока',
    movementPatterns: [P.VERTICAL_PULL],
    primaryMuscles: [M.LATS, M.BICEPS], secondaryMuscles: [M.BACK],
    jointInvolvement: [J.SHOULDER],
    equipmentRequired: ['cable'], equipmentAccessMin: EquipmentAccess.GYM,
    difficulty: 2, technicalDemand: 'low',
  },

  // ============= LUNGE =============
  {
    slug: 'forward_lunge', name: 'Forward Lunge', nameRu: 'Выпады вперёд',
    movementPatterns: [P.LUNGE],
    primaryMuscles: [M.QUADRICEPS, M.GLUTES],
    jointInvolvement: [J.KNEE, J.HIP],
    contraindications: [InjuryFlag.KNEE],
    equipmentRequired: ['bodyweight'], equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
    difficulty: 2, technicalDemand: 'medium',
  },
  {
    slug: 'reverse_lunge', name: 'Reverse Lunge', nameRu: 'Выпады назад',
    movementPatterns: [P.LUNGE],
    primaryMuscles: [M.QUADRICEPS, M.GLUTES],
    jointInvolvement: [J.KNEE, J.HIP],
    equipmentRequired: ['bodyweight'], equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
    difficulty: 2, technicalDemand: 'low',
  },
  {
    slug: 'walking_lunge', name: 'Walking Lunge', nameRu: 'Выпады в движении',
    movementPatterns: [P.LUNGE],
    primaryMuscles: [M.QUADRICEPS, M.GLUTES], secondaryMuscles: [M.HAMSTRINGS],
    jointInvolvement: [J.KNEE, J.HIP],
    contraindications: [InjuryFlag.KNEE],
    equipmentRequired: ['bodyweight'], equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
    difficulty: 3, technicalDemand: 'medium',
  },

  // ============= CORE =============
  {
    slug: 'plank', name: 'Plank', nameRu: 'Планка',
    movementPatterns: [P.CORE],
    primaryMuscles: [M.ABS], secondaryMuscles: [M.SHOULDERS],
    jointInvolvement: [J.SPINE],
    equipmentRequired: ['bodyweight'], equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
    difficulty: 1, technicalDemand: 'low',
  },
  {
    slug: 'dead_bug', name: 'Dead Bug', nameRu: 'Dead Bug',
    movementPatterns: [P.CORE],
    primaryMuscles: [M.ABS],
    jointInvolvement: [J.SPINE],
    equipmentRequired: ['bodyweight'], equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
    difficulty: 1, technicalDemand: 'low',
  },
  {
    slug: 'pallof_press', name: 'Pallof Press', nameRu: 'Pallof Press (антиротация)',
    movementPatterns: [P.CORE],
    primaryMuscles: [M.ABS],
    jointInvolvement: [J.SPINE],
    equipmentRequired: ['cable', 'band'], equipmentAccessMin: EquipmentAccess.HOME_DUMBBELLS,
    difficulty: 2, technicalDemand: 'medium',
  },
  {
    slug: 'hanging_leg_raise', name: 'Hanging Leg Raise', nameRu: 'Подъём ног в висе',
    movementPatterns: [P.CORE],
    primaryMuscles: [M.ABS], secondaryMuscles: [M.FOREARMS],
    jointInvolvement: [J.SHOULDER, J.SPINE],
    equipmentRequired: ['bar'], equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
    difficulty: 3, technicalDemand: 'medium',
  },
  {
    slug: 'ab_wheel', name: 'Ab Wheel Rollout', nameRu: 'Ролик для пресса',
    movementPatterns: [P.CORE],
    primaryMuscles: [M.ABS], secondaryMuscles: [M.SHOULDERS],
    jointInvolvement: [J.SHOULDER, J.SPINE],
    contraindications: [InjuryFlag.LOWER_BACK],
    equipmentRequired: ['ab_wheel'], equipmentAccessMin: EquipmentAccess.HOME_DUMBBELLS,
    difficulty: 4, technicalDemand: 'high',
  },

  // ============= CARRY =============
  {
    slug: 'farmer_carry', name: 'Farmer Carry', nameRu: 'Прогулка фермера',
    movementPatterns: [P.CARRY],
    primaryMuscles: [M.FOREARMS, M.TRAPS], secondaryMuscles: [M.ABS, M.GLUTES],
    jointInvolvement: [J.SPINE, J.SHOULDER],
    equipmentRequired: ['dumbbells'], equipmentAccessMin: EquipmentAccess.HOME_DUMBBELLS,
    difficulty: 2, technicalDemand: 'low',
  },
  {
    slug: 'suitcase_carry', name: 'Suitcase Carry', nameRu: 'Suitcase-прогулка',
    movementPatterns: [P.CARRY, P.CORE],
    primaryMuscles: [M.ABS, M.FOREARMS],
    jointInvolvement: [J.SPINE],
    equipmentRequired: ['dumbbells'], equipmentAccessMin: EquipmentAccess.HOME_DUMBBELLS,
    difficulty: 2, technicalDemand: 'low',
  },

  // ============= ISOLATION =============
  {
    slug: 'biceps_curl', name: 'Biceps Curl', nameRu: 'Сгибание на бицепс',
    movementPatterns: [P.ISOLATION],
    primaryMuscles: [M.BICEPS],
    jointInvolvement: [],
    equipmentRequired: ['dumbbells'], equipmentAccessMin: EquipmentAccess.HOME_DUMBBELLS,
    difficulty: 1, technicalDemand: 'low',
  },
  {
    slug: 'triceps_extension', name: 'Triceps Extension', nameRu: 'Разгибание на трицепс',
    movementPatterns: [P.ISOLATION],
    primaryMuscles: [M.TRICEPS],
    jointInvolvement: [],
    equipmentRequired: ['dumbbells'], equipmentAccessMin: EquipmentAccess.HOME_DUMBBELLS,
    difficulty: 1, technicalDemand: 'low',
  },
  {
    slug: 'lateral_raise', name: 'Lateral Raise', nameRu: 'Махи в стороны',
    movementPatterns: [P.ISOLATION],
    primaryMuscles: [M.SHOULDERS],
    jointInvolvement: [J.SHOULDER],
    contraindications: [InjuryFlag.SHOULDER],
    equipmentRequired: ['dumbbells'], equipmentAccessMin: EquipmentAccess.HOME_DUMBBELLS,
    difficulty: 1, technicalDemand: 'low',
  },
  {
    slug: 'face_pull', name: 'Face Pull', nameRu: 'Face Pull (тяга к лицу)',
    movementPatterns: [P.ISOLATION, P.HORIZONTAL_PULL],
    primaryMuscles: [M.SHOULDERS, M.TRAPS],
    jointInvolvement: [J.SHOULDER],
    equipmentRequired: ['cable', 'band'], equipmentAccessMin: EquipmentAccess.HOME_DUMBBELLS,
    difficulty: 1, technicalDemand: 'low',
  },
  {
    slug: 'leg_extension', name: 'Leg Extension', nameRu: 'Разгибание ног',
    movementPatterns: [P.ISOLATION],
    primaryMuscles: [M.QUADRICEPS],
    jointInvolvement: [J.KNEE],
    contraindications: [InjuryFlag.KNEE],
    equipmentRequired: ['machine'], equipmentAccessMin: EquipmentAccess.GYM,
    difficulty: 1, technicalDemand: 'low',
  },
  {
    slug: 'leg_curl', name: 'Leg Curl', nameRu: 'Сгибание ног',
    movementPatterns: [P.ISOLATION],
    primaryMuscles: [M.HAMSTRINGS],
    jointInvolvement: [J.KNEE],
    equipmentRequired: ['machine'], equipmentAccessMin: EquipmentAccess.GYM,
    difficulty: 1, technicalDemand: 'low',
  },
  {
    slug: 'calf_raise', name: 'Calf Raise', nameRu: 'Подъём на носки',
    movementPatterns: [P.ISOLATION],
    primaryMuscles: [M.CALVES],
    jointInvolvement: [J.ANKLE],
    contraindications: [InjuryFlag.ANKLE],
    equipmentRequired: ['bodyweight'], equipmentAccessMin: EquipmentAccess.BODYWEIGHT,
    difficulty: 1, technicalDemand: 'low',
  },
];
