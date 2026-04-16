/**
 * Определение "compound" упражнений по slug — используется для прогрессии
 * (compound получает +2.5кг, isolation +1.25кг).
 *
 * Правило: любой exercise с movementPatterns, содержащим не-ISOLATION паттерн,
 * считается compound. Но этот helper работает и по slug как быстрая проверка.
 */
import { MovementPattern } from '../enums';

export function isCompoundByPatterns(patterns: MovementPattern[]): boolean {
  if (!patterns || patterns.length === 0) return false;
  // Любой паттерн кроме ISOLATION = compound
  return patterns.some((p) => p !== MovementPattern.ISOLATION);
}
