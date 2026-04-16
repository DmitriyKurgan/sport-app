import { AvatarParams } from '../interfaces/avatar-params.interface';
import {
  deriveChestDepthFromBMI,
  deriveWaistFromBMI,
  mapToRange,
  normalizeToUnit,
  round2,
  round3,
} from './helpers';

/**
 * Входы для расчёта параметров. Все поля, кроме профильных, опциональны —
 * если нет замера или scoring, берётся разумный default.
 */
export interface AvatarParamsInputs {
  // профиль (всегда есть)
  sex: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  bmi: number | null;

  // замеры тела (если есть)
  chestCm?: number | null;
  waistCm?: number | null;
  hipsCm?: number | null;
  bicepsCm?: number | null;
  thighCm?: number | null;

  // scoring (если есть)
  adiposityScore?: number;
  muscularityScore?: number;
}

/**
 * Чистая функция: из входов собирает AvatarParams.
 * Все значения обрезаются в допустимые диапазоны [0.7..1.3] и [0..1].
 *
 * Маппинг из architecture.md 2.9.
 */
export function calculateAvatarParams(inputs: AvatarParamsInputs): AvatarParams {
  const {
    sex,
    heightCm,
    weightKg: _weightKg,
    bmi,
    chestCm,
    waistCm,
    hipsCm,
    bicepsCm,
    thighCm,
    adiposityScore = 0,
    muscularityScore = 0,
  } = inputs;

  // heightScale: 175cm = 1.0
  const heightScale = round3(heightCm / 175);

  // shoulderWidth: из обхвата груди или default по полу
  const shoulderDefault = sex === 'male' ? 1.0 : 0.85;
  const shoulderWidth = round3(
    chestCm ? mapToRange(chestCm, 85, 130) : shoulderDefault,
  );

  // chestDepth: из замера груди или из BMI
  const chestDepth = round3(
    chestCm ? mapToRange(chestCm, 85, 130) : deriveChestDepthFromBMI(bmi),
  );

  // waistWidth: из замера талии или производное от BMI + adiposity
  const waistWidth = round3(
    waistCm ? mapToRange(waistCm, 60, 120) : deriveWaistFromBMI(bmi, adiposityScore),
  );

  // hipWidth: из замера бёдер или default с учётом пола
  const hipsDefault = sex === 'female' ? 1.05 : 1.0;
  const hipWidth = round3(hipsCm ? mapToRange(hipsCm, 75, 120) : hipsDefault);

  // armGirth: из бицепса или производное от muscularity
  const armGirth = round3(
    bicepsCm ? mapToRange(bicepsCm, 25, 45) : muscularityAdjustedDefault(muscularityScore),
  );

  // thighGirth: из замера бедра или производное от muscularity + adiposity
  const thighGirth = round3(
    thighCm
      ? mapToRange(thighCm, 45, 75)
      : muscularityAdjustedDefault(muscularityScore + adiposityScore * 0.3),
  );

  // muscleDefinition: чем выше muscularity и ниже adiposity → тем выше рельеф
  const defZ = muscularityScore - adiposityScore * 0.7;
  const muscleDefinition = round2(normalizeToUnit(defZ));

  // bodyFatLayer: прямо пропорционально adiposity
  const bodyFatLayer = round2(normalizeToUnit(adiposityScore));

  return {
    heightScale,
    shoulderWidth,
    chestDepth,
    waistWidth,
    hipWidth,
    armGirth,
    thighGirth,
    muscleDefinition,
    bodyFatLayer,
  };
}

function muscularityAdjustedDefault(muscularity: number): number {
  // z-score -2..+2 → диапазон 0.85..1.15
  return mapToRange(muscularity, -2, 2, 0.85, 1.15);
}
