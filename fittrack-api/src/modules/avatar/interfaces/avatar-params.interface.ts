/**
 * Параметры голограф-аватара, передаваемые на фронт для рендера
 * (Three.js morph targets + hologram shader).
 *
 * Диапазон каждого параметра: примерно 0.7–1.3 (1.0 — средний человек),
 * кроме muscleDefinition и bodyFatLayer — 0.0–1.0 (интенсивность шейдерного слоя).
 *
 * См. architecture.md 2.9.
 */
export interface AvatarParams {
  heightScale: number;        // 1.0 = 175cm
  shoulderWidth: number;      // 0.7–1.3
  chestDepth: number;         // 0.7–1.3
  waistWidth: number;         // 0.7–1.3
  hipWidth: number;           // 0.7–1.3
  armGirth: number;           // 0.7–1.3
  thighGirth: number;         // 0.7–1.3
  muscleDefinition: number;   // 0.0–1.0 (чем выше — тем более выражен рельеф)
  bodyFatLayer: number;       // 0.0–1.0 (толщина жирового слоя для шейдера)
}

/**
 * Дельта между двумя snapshot'ами для анимации трансформации.
 */
export type AvatarDelta = {
  [K in keyof AvatarParams]: number; // target - source
};
