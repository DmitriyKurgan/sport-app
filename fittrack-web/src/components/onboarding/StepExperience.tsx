'use client';

import { RadioGroup } from '@/components/forms/RadioGroup';
import { Input } from '@/components/ui/Input';
import { ExperienceLevel, TechnicalConfidence } from '@/types';

interface Props {
  experienceLevel: ExperienceLevel | undefined;
  currentTrainingDaysPerWeek: number | undefined;
  technicalConfidence: TechnicalConfidence | undefined;
  onChange: (data: {
    experienceLevel?: ExperienceLevel;
    currentTrainingDaysPerWeek?: number;
    technicalConfidence?: TechnicalConfidence;
  }) => void;
}

export function StepExperience({
  experienceLevel,
  currentTrainingDaysPerWeek,
  technicalConfidence,
  onChange,
}: Props) {
  return (
    <div className="space-y-5">
      <RadioGroup<ExperienceLevel>
        label="Опыт тренировок"
        value={experienceLevel ?? null}
        onChange={(v) => onChange({ experienceLevel: v })}
        options={[
          { value: 'none', label: 'Нет опыта', description: 'Никогда не тренировался регулярно' },
          { value: 'novice', label: 'Новичок', description: 'До 6 месяцев системных тренировок' },
          { value: 'intermediate', label: 'Средний', description: '6–24 месяца стабильно' },
        ]}
      />
      <Input
        type="number"
        label="Сейчас тренируюсь дней в неделю"
        min={0}
        max={7}
        value={currentTrainingDaysPerWeek ?? ''}
        onChange={(e) =>
          onChange({
            currentTrainingDaysPerWeek: e.target.value ? Number(e.target.value) : undefined,
          })
        }
      />
      <RadioGroup<TechnicalConfidence>
        label="Уверенность в технике (опц.)"
        value={technicalConfidence ?? null}
        onChange={(v) => onChange({ technicalConfidence: v })}
        options={[
          { value: 'low', label: 'Низкая' },
          { value: 'medium', label: 'Средняя' },
          { value: 'high', label: 'Высокая' },
        ]}
        columns={3}
      />
    </div>
  );
}
