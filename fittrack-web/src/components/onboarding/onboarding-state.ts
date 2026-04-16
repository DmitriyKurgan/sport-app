import { CreateProfileRequest } from '@/types';

export interface OnboardingState {
  // PreScreening: PARQ answers
  parqAnswers: Record<string, boolean>;
  // Profile fields (postponed assembly until Summary)
  profile: Partial<CreateProfileRequest>;
}

export const INITIAL_ONBOARDING: OnboardingState = {
  parqAnswers: {},
  profile: {
    injuryPainFlags: ['none'],
    dietaryRestrictions: [],
  },
};

export const TOTAL_STEPS = 9;

export const STEP_LABELS: string[] = [
  'Безопасность',
  'Личные данные',
  'Параметры тела',
  'Опыт',
  'Цели',
  'Оборудование',
  'Образ жизни',
  'Базовые силовые',
  'Готово',
];
