import { AvatarDelta, AvatarParams } from '../interfaces/avatar-params.interface';

/**
 * Рассчитывает разницу между двумя snapshot'ами параметров.
 * Используется фронтом для анимации трансформации аватара.
 *
 * Положительная delta = значение выросло, отрицательная = уменьшилось.
 */
export function calculateAvatarDelta(from: AvatarParams, to: AvatarParams): AvatarDelta {
  const round3 = (v: number) => Math.round(v * 1000) / 1000;
  return {
    heightScale: round3(to.heightScale - from.heightScale),
    shoulderWidth: round3(to.shoulderWidth - from.shoulderWidth),
    chestDepth: round3(to.chestDepth - from.chestDepth),
    waistWidth: round3(to.waistWidth - from.waistWidth),
    hipWidth: round3(to.hipWidth - from.hipWidth),
    armGirth: round3(to.armGirth - from.armGirth),
    thighGirth: round3(to.thighGirth - from.thighGirth),
    muscleDefinition: round3(to.muscleDefinition - from.muscleDefinition),
    bodyFatLayer: round3(to.bodyFatLayer - from.bodyFatLayer),
  };
}
