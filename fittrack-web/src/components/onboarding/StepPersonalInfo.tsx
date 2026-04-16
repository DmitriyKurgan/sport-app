'use client';

import { RadioGroup } from '@/components/forms/RadioGroup';
import { Input } from '@/components/ui/Input';
import { Gender } from '@/types';

interface Props {
  sex: Gender | undefined;
  ageYears: number | undefined;
  onChange: (data: { sex?: Gender; ageYears?: number }) => void;
}

export function StepPersonalInfo({ sex, ageYears, onChange }: Props) {
  return (
    <div className="space-y-5">
      <RadioGroup<Gender>
        label="Пол"
        value={sex ?? null}
        onChange={(v) => onChange({ sex: v })}
        options={[
          { value: 'male', label: 'Мужской' },
          { value: 'female', label: 'Женский' },
        ]}
        columns={2}
      />
      <Input
        type="number"
        label="Возраст"
        min={14}
        max={80}
        value={ageYears ?? ''}
        onChange={(e) => onChange({ ageYears: e.target.value ? Number(e.target.value) : undefined })}
        helperText="14–80 лет"
      />
    </div>
  );
}
