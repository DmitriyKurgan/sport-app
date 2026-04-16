/**
 * Канонические вопросы PAR-Q+ (Physical Activity Readiness Questionnaire).
 * Источник: sport-research.md — блок про предскрининг безопасности.
 *
 * Если хотя бы на один вопрос с `redFlagIfYes=true` получен YES —
 * TrainingEngine генерирует программу в режиме LOW_INTENSITY
 * и UI показывает рекомендацию консультации со специалистом.
 */

export interface PARQQuestion {
  id: string;
  text: string;
  redFlagIfYes: boolean;
  requiresClarification?: boolean; // для вопросов типа pregnant — не red flag, но требует пояснения
}

export const PARQ_QUESTIONS: readonly PARQQuestion[] = [
  {
    id: 'heart_condition',
    text:
      'Говорил ли вам врач, что у вас проблемы с сердцем, и что вы должны заниматься физической активностью только под присмотром специалиста?',
    redFlagIfYes: true,
  },
  {
    id: 'chest_pain_activity',
    text: 'Чувствуете ли вы боль в груди при физической активности?',
    redFlagIfYes: true,
  },
  {
    id: 'chest_pain_rest',
    text: 'Чувствовали ли вы боль в груди в последний месяц, находясь в покое?',
    redFlagIfYes: true,
  },
  {
    id: 'balance_dizzy',
    text:
      'Теряли ли вы равновесие из-за головокружения или теряли сознание за последние 12 месяцев?',
    redFlagIfYes: true,
  },
  {
    id: 'bone_joint',
    text:
      'Есть ли у вас проблемы с костями или суставами (колено, спина и т.п.), которые могут ухудшиться при физической активности?',
    redFlagIfYes: true,
  },
  {
    id: 'medication_bp_heart',
    text: 'Принимаете ли вы лекарства от давления или для сердца?',
    redFlagIfYes: true,
  },
  {
    id: 'other_reason',
    text: 'Знаете ли вы какую-либо другую причину, по которой вам не стоит заниматься спортом?',
    redFlagIfYes: true,
  },
  {
    id: 'pregnant',
    text: 'Беременны ли вы?',
    redFlagIfYes: false,
    requiresClarification: true,
  },
] as const;

export const PARQ_QUESTION_IDS: readonly string[] = PARQ_QUESTIONS.map((q) => q.id);
