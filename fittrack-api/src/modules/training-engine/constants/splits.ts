import { MovementPattern, SplitType } from '../enums';

/**
 * Правила сплитов по количеству дней/нед.
 * Источник: sport-research.md → weeklySplitsRules.
 *
 * Каждый splitTag ставится в соответствие набору "целевых паттернов" —
 * day-generator подбирает упражнения, покрывающие эти паттерны.
 */

export interface DayPatternMap {
  splitTag: string;
  name: string; // отображаемое имя
  patterns: MovementPattern[];
}

export interface SplitRule {
  type: SplitType;
  days: DayPatternMap[];
  /** Для 6 дней — требует хорошего восстановления (sleep≥7 AND stress≠high). */
  recoveryGated?: boolean;
}

const {
  SQUAT, HINGE,
  HORIZONTAL_PUSH, HORIZONTAL_PULL,
  VERTICAL_PUSH, VERTICAL_PULL,
  CORE, LUNGE, ISOLATION,
} = MovementPattern;

/** Full Body шаблоны: A/B/C чередуют акценты, но покрытие squat+hinge+push+pull+core обязательно каждый раз. */
const FULL_BODY_A: DayPatternMap = {
  splitTag: 'full_body_a',
  name: 'Full Body A',
  patterns: [SQUAT, HORIZONTAL_PUSH, HORIZONTAL_PULL, CORE],
};
const FULL_BODY_B: DayPatternMap = {
  splitTag: 'full_body_b',
  name: 'Full Body B',
  patterns: [HINGE, VERTICAL_PUSH, VERTICAL_PULL, CORE],
};
const FULL_BODY_C: DayPatternMap = {
  splitTag: 'full_body_c',
  name: 'Full Body C',
  patterns: [SQUAT, HORIZONTAL_PUSH, VERTICAL_PULL, LUNGE, CORE],
};

const UPPER_A: DayPatternMap = {
  splitTag: 'upper_a',
  name: 'Upper A',
  patterns: [HORIZONTAL_PUSH, HORIZONTAL_PULL, VERTICAL_PULL, ISOLATION],
};
const UPPER_B: DayPatternMap = {
  splitTag: 'upper_b',
  name: 'Upper B',
  patterns: [VERTICAL_PUSH, HORIZONTAL_PULL, HORIZONTAL_PUSH, ISOLATION],
};
const LOWER_A: DayPatternMap = {
  splitTag: 'lower_a',
  name: 'Lower A',
  patterns: [SQUAT, HINGE, CORE],
};
const LOWER_B: DayPatternMap = {
  splitTag: 'lower_b',
  name: 'Lower B',
  patterns: [HINGE, LUNGE, SQUAT, CORE],
};
const FULL_BODY_ACCESSORIES: DayPatternMap = {
  splitTag: 'full_body_accessories',
  name: 'Accessories / Conditioning',
  patterns: [ISOLATION, CORE, LUNGE],
};

const PUSH_A: DayPatternMap = {
  splitTag: 'push_a',
  name: 'Push A',
  patterns: [HORIZONTAL_PUSH, VERTICAL_PUSH, ISOLATION],
};
const PUSH_B: DayPatternMap = {
  splitTag: 'push_b',
  name: 'Push B',
  patterns: [VERTICAL_PUSH, HORIZONTAL_PUSH, ISOLATION],
};
const PULL_A: DayPatternMap = {
  splitTag: 'pull_a',
  name: 'Pull A',
  patterns: [HORIZONTAL_PULL, VERTICAL_PULL, ISOLATION],
};
const PULL_B: DayPatternMap = {
  splitTag: 'pull_b',
  name: 'Pull B',
  patterns: [VERTICAL_PULL, HORIZONTAL_PULL, ISOLATION],
};
const LEGS_A: DayPatternMap = {
  splitTag: 'legs_a',
  name: 'Legs A',
  patterns: [SQUAT, HINGE, CORE],
};
const LEGS_B: DayPatternMap = {
  splitTag: 'legs_b',
  name: 'Legs B',
  patterns: [HINGE, LUNGE, CORE],
};

export const SPLIT_RULES: Record<number, SplitRule> = {
  2: { type: SplitType.FULL_BODY, days: [FULL_BODY_A, FULL_BODY_B] },
  3: { type: SplitType.FULL_BODY, days: [FULL_BODY_A, FULL_BODY_B, FULL_BODY_C] },
  4: { type: SplitType.UPPER_LOWER, days: [UPPER_A, LOWER_A, UPPER_B, LOWER_B] },
  5: {
    type: SplitType.UPPER_LOWER_PLUS,
    days: [UPPER_A, LOWER_A, UPPER_B, LOWER_B, FULL_BODY_ACCESSORIES],
  },
  6: {
    type: SplitType.PPL,
    days: [PUSH_A, PULL_A, LEGS_A, PUSH_B, PULL_B, LEGS_B],
    recoveryGated: true,
  },
};

export function getSplitRule(days: number): SplitRule {
  const rule = SPLIT_RULES[days];
  if (!rule) throw new Error(`No split rule for ${days} days. Supported: 2-6.`);
  return rule;
}
