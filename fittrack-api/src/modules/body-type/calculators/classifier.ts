import {
  BodyClassification,
  BodyComponent,
  BodyScores,
  ClassificationConfidence,
} from '../interfaces';

/** Пороги z-score для "high" / "low". */
const HIGH = 0.5;
const LOW = -0.5;

/** Если отрыв топ-компонента от следующего мал — confidence низкая. */
const STRONG_DOMINANCE_GAP = 0.6;

/**
 * Классификация по numeric scoring.
 * Правила (architecture.md 2.8):
 *   ectomorph:  linearity > HIGH AND adiposity < LOW
 *   mesomorph:  muscularity > HIGH AND adiposity <= HIGH
 *   endomorph:  adiposity > HIGH
 *   hybrid:     otherwise — top-2 компонента с confidence
 *
 * Порядок проверок важен: эктоморф проверяется раньше мезоморфа,
 * т.к. у линейных людей мускулистость может быть в норме и попасть в HIGH.
 */
export function classify(scores: BodyScores): BodyClassification {
  // 1. Endomorph — высокая адипозность доминирует
  if (scores.adiposity > HIGH && scores.adiposity >= scores.muscularity) {
    return {
      type: 'endomorph',
      confidence: confidenceFromDominance(scores, 'adiposity'),
      dominantComponents: [],
    };
  }

  // 2. Ectomorph — линейность + низкая адипозность
  if (scores.linearity > HIGH && scores.adiposity < LOW) {
    return {
      type: 'ectomorph',
      confidence: confidenceFromDominance(scores, 'linearity'),
      dominantComponents: [],
    };
  }

  // 3. Mesomorph — высокая мускулистость при умеренной адипозности
  if (scores.muscularity > HIGH && scores.adiposity <= HIGH) {
    return {
      type: 'mesomorph',
      confidence: confidenceFromDominance(scores, 'muscularity'),
      dominantComponents: [],
    };
  }

  // 4. Hybrid: top-2 компонента по абсолютной величине
  const ranked = rankComponents(scores);
  const top2 = ranked.slice(0, 2).map((r) => r.component);

  return {
    type: 'hybrid',
    confidence: 'low',
    dominantComponents: top2,
  };
}

function rankComponents(scores: BodyScores): { component: BodyComponent; value: number }[] {
  return (
    [
      { component: 'adiposity' as const, value: scores.adiposity },
      { component: 'muscularity' as const, value: scores.muscularity },
      { component: 'linearity' as const, value: scores.linearity },
    ]
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
  );
}

function confidenceFromDominance(
  scores: BodyScores,
  dominant: BodyComponent,
): ClassificationConfidence {
  const ranked = rankComponents(scores);
  if (ranked[0].component !== dominant) return 'low';

  const gap = Math.abs(ranked[0].value) - Math.abs(ranked[1].value);
  if (gap >= STRONG_DOMINANCE_GAP) return 'high';
  if (gap >= STRONG_DOMINANCE_GAP / 2) return 'medium';
  return 'low';
}
