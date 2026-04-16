'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import {
  INITIAL_ONBOARDING,
  STEP_LABELS,
  TOTAL_STEPS,
  type OnboardingState,
} from '@/components/onboarding/onboarding-state';
import {
  isPreScreeningComplete,
  StepPreScreening,
} from '@/components/onboarding/StepPreScreening';
import { StepPersonalInfo } from '@/components/onboarding/StepPersonalInfo';
import { StepBodyMetrics } from '@/components/onboarding/StepBodyMetrics';
import { StepExperience } from '@/components/onboarding/StepExperience';
import { StepGoals } from '@/components/onboarding/StepGoals';
import { StepEquipment } from '@/components/onboarding/StepEquipment';
import { StepLifestyle } from '@/components/onboarding/StepLifestyle';
import { StepBaselineStrength } from '@/components/onboarding/StepBaselineStrength';
import { StepSummary } from '@/components/onboarding/StepSummary';
import { getErrorMessage } from '@/lib/errors';
import { useRecalculateBodyTypeMutation } from '@/store/api/bodyTypeApi';
import { useGeneratePlanMutation } from '@/store/api/nutritionApi';
import { useCreateProfileMutation } from '@/store/api/profileApi';
import {
  useGetQuestionsQuery,
  useSubmitScreeningMutation,
} from '@/store/api/screeningApi';
import { useGenerateProgramMutation } from '@/store/api/trainingApi';
import { CreateProfileRequest } from '@/types';

export default function OnboardingPage() {
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState<OnboardingState>(INITIAL_ONBOARDING);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const { data: questionsData } = useGetQuestionsQuery();
  const [submitScreening] = useSubmitScreeningMutation();
  const [createProfile] = useCreateProfileMutation();
  const [generateProgram] = useGenerateProgramMutation();
  const [generatePlan] = useGeneratePlanMutation();
  const [recalculateBodyType] = useRecalculateBodyTypeMutation();

  const expectedQuestionIds = useMemo(
    () => questionsData?.questions.map((q) => q.id) ?? [],
    [questionsData],
  );

  const updateProfile = (data: Partial<CreateProfileRequest>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...data } }));
  };

  // Валидация текущего шага: можно ли двигаться дальше
  const canProceed = (() => {
    const p = state.profile;
    switch (step) {
      case 0:
        return isPreScreeningComplete(state.parqAnswers, expectedQuestionIds);
      case 1:
        return Boolean(p.sex && p.ageYears);
      case 2:
        return Boolean(p.heightCm && p.weightKg);
      case 3:
        return Boolean(p.experienceLevel && p.currentTrainingDaysPerWeek !== undefined);
      case 4:
        return Boolean(
          p.primaryTrainingGoal &&
            p.bodyweightGoal &&
            p.weeklyTrainingDaysTarget &&
            p.sessionDurationMinutes,
        );
      case 5:
        return Boolean(p.equipmentAccess);
      case 6:
        return Boolean(
          p.sleepHoursAvg !== undefined &&
            p.stressLevel &&
            p.dailyActivityLevel &&
            p.nutritionTierPreference,
        );
      case 7:
        return true; // baseline strength опционален
      case 8:
        return true;
      default:
        return false;
    }
  })();

  const isOptionalStep = step === 7; // baseline strength

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // 1. PAR-Q+
      const screeningResult = await submitScreening({ answers: state.parqAnswers }).unwrap();

      // 2. Profile
      await createProfile(state.profile as CreateProfileRequest).unwrap();

      // 3-5. Programs + nutrition + scoring (параллельно)
      await Promise.all([
        generateProgram().unwrap(),
        generatePlan().unwrap(),
        recalculateBodyType().unwrap(),
      ]);

      toast.success(
        screeningResult.redFlags
          ? 'Профиль создан. Запущен режим низкой интенсивности.'
          : 'Профиль готов! Программа и план питания сгенерированы.',
      );
      router.replace('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Не удалось завершить онбординг'));
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else void handleSubmit();
  };
  const back = () => setStep(Math.max(0, step - 1));

  const hasRedFlags = useMemo(() => {
    if (!questionsData) return false;
    return questionsData.questions.some(
      (q) => q.redFlagIfYes && state.parqAnswers[q.id] === true,
    );
  }, [questionsData, state.parqAnswers]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-2">
      {/* Прогресс */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">
            Шаг {step + 1} из {TOTAL_STEPS}: {STEP_LABELS[step]}
          </span>
          <span className="text-gray-500">
            {Math.round(((step + 1) / TOTAL_STEPS) * 100)}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-brand-600 transition-all"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Контент шага */}
      <div className="min-h-[300px]">
        {step === 0 && (
          <StepPreScreening
            answers={state.parqAnswers}
            onChange={(a) => setState((s) => ({ ...s, parqAnswers: a }))}
          />
        )}
        {step === 1 && (
          <StepPersonalInfo
            sex={state.profile.sex}
            ageYears={state.profile.ageYears}
            onChange={updateProfile}
          />
        )}
        {step === 2 && (
          <StepBodyMetrics
            heightCm={state.profile.heightCm}
            weightKg={state.profile.weightKg}
            waistCm={state.profile.waistCm}
            onChange={updateProfile}
          />
        )}
        {step === 3 && (
          <StepExperience
            experienceLevel={state.profile.experienceLevel}
            currentTrainingDaysPerWeek={state.profile.currentTrainingDaysPerWeek}
            technicalConfidence={state.profile.technicalConfidence}
            onChange={updateProfile}
          />
        )}
        {step === 4 && (
          <StepGoals
            primaryTrainingGoal={state.profile.primaryTrainingGoal}
            bodyweightGoal={state.profile.bodyweightGoal}
            weeklyTrainingDaysTarget={state.profile.weeklyTrainingDaysTarget}
            sessionDurationMinutes={state.profile.sessionDurationMinutes}
            onChange={updateProfile}
          />
        )}
        {step === 5 && (
          <StepEquipment
            equipmentAccess={state.profile.equipmentAccess}
            injuryPainFlags={state.profile.injuryPainFlags}
            onChange={updateProfile}
          />
        )}
        {step === 6 && (
          <StepLifestyle
            sleepHoursAvg={state.profile.sleepHoursAvg}
            stressLevel={state.profile.stressLevel}
            dailyActivityLevel={state.profile.dailyActivityLevel}
            nutritionTierPreference={state.profile.nutritionTierPreference}
            dietaryRestrictions={state.profile.dietaryRestrictions}
            onChange={updateProfile}
          />
        )}
        {step === 7 && (
          <StepBaselineStrength
            baseline={state.profile.baselineStrengthOptional}
            onChange={(v) => updateProfile({ baselineStrengthOptional: v })}
          />
        )}
        {step === 8 && (
          <StepSummary profile={state.profile} hasRedFlags={hasRedFlags} />
        )}
      </div>

      {/* Навигация */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <Button variant="ghost" onClick={back} disabled={step === 0 || submitting}>
          <ChevronLeft className="h-4 w-4" />
          Назад
        </Button>
        <div className="flex gap-2">
          {isOptionalStep && (
            <Button variant="ghost" onClick={() => setStep(step + 1)} disabled={submitting}>
              Пропустить
            </Button>
          )}
          <Button onClick={next} disabled={!canProceed} loading={submitting}>
            {step === TOTAL_STEPS - 1 ? 'Завершить' : 'Далее'}
            {step < TOTAL_STEPS - 1 && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
