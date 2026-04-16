'use client';

import { RadioGroup } from '@/components/forms/RadioGroup';
import { Input } from '@/components/ui/Input';
import { BodyweightGoal, PrimaryTrainingGoal, SessionDuration } from '@/types';

interface Props {
  primaryTrainingGoal: PrimaryTrainingGoal | undefined;
  bodyweightGoal: BodyweightGoal | undefined;
  weeklyTrainingDaysTarget: number | undefined;
  sessionDurationMinutes: SessionDuration | undefined;
  onChange: (data: {
    primaryTrainingGoal?: PrimaryTrainingGoal;
    bodyweightGoal?: BodyweightGoal;
    weeklyTrainingDaysTarget?: number;
    sessionDurationMinutes?: SessionDuration;
  }) => void;
}

export function StepGoals({
  primaryTrainingGoal,
  bodyweightGoal,
  weeklyTrainingDaysTarget,
  sessionDurationMinutes,
  onChange,
}: Props) {
  return (
    <div className="space-y-5">
      <RadioGroup<PrimaryTrainingGoal>
        label="Главная цель тренировок"
        value={primaryTrainingGoal ?? null}
        onChange={(v) => onChange({ primaryTrainingGoal: v })}
        options={[
          { value: 'strength', label: 'Сила' },
          { value: 'hypertrophy', label: 'Мышечная масса' },
          { value: 'fitness', label: 'Общий фитнес' },
          { value: 'endurance_mixed', label: 'Выносливость' },
          { value: 'sport_prep', label: 'Подготовка к спорту' },
        ]}
        columns={2}
      />
      <RadioGroup<BodyweightGoal>
        label="Цель по весу"
        value={bodyweightGoal ?? null}
        onChange={(v) => onChange({ bodyweightGoal: v })}
        options={[
          { value: 'cut', label: 'Снизить', description: 'Дефицит ~300–600 ккал' },
          { value: 'maintain', label: 'Поддерживать' },
          { value: 'bulk', label: 'Набрать', description: 'Профицит ~150 ккал' },
        ]}
        columns={3}
      />
      <Input
        type="number"
        label="Желаемое число тренировок в неделю"
        min={2}
        max={6}
        value={weeklyTrainingDaysTarget ?? ''}
        onChange={(e) =>
          onChange({
            weeklyTrainingDaysTarget: e.target.value ? Number(e.target.value) : undefined,
          })
        }
        helperText="2–6 (новичкам максимум 4)"
      />
      <RadioGroup<SessionDuration>
        label="Длительность тренировки"
        value={sessionDurationMinutes ?? null}
        onChange={(v) => onChange({ sessionDurationMinutes: v })}
        options={[
          { value: 30, label: '30 мин' },
          { value: 45, label: '45 мин' },
          { value: 60, label: '60 мин' },
          { value: 75, label: '75 мин' },
          { value: 90, label: '90 мин' },
        ]}
        columns={3}
      />
    </div>
  );
}
