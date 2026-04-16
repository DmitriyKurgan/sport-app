/**
 * Numeric scoring телосложения (z-scores относительно референсной популяции).
 * См. architecture.md 2.8 и sport-research.md bodyTypeSystem.
 *
 * Идея: классификация ectomorph/mesomorph/endomorph — UX-ярлык,
 * в ядре работаем с этими числовыми оценками.
 */
export interface BodyScores {
  adiposity: number;   // z-score: > 0 — больше жировой массы чем среднее
  muscularity: number; // z-score: > 0 — выше относительная сила/мускулистость
  linearity: number;   // z-score: > 0 — более "линейный" (эктоморфный)
}

export type BodyComponent = 'adiposity' | 'muscularity' | 'linearity';
