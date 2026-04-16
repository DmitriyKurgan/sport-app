'use client';

import { Input } from '@/components/ui/Input';
import { BaselineStrength } from '@/types';

interface Props {
  baseline: BaselineStrength | undefined;
  onChange: (data: BaselineStrength) => void;
}

export function StepBaselineStrength({ baseline, onChange }: Props) {
  const set = (field: keyof BaselineStrength, value: string) => {
    onChange({
      ...baseline,
      [field]: value ? Number(value) : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Если знаете свои рабочие веса — внесите. Это позволит сразу подобрать стартовые нагрузки.
        Если не знаете — пропустите, неделя 1 будет калибровкой.
      </p>
      <Input
        type="number"
        label="Присед (1RM или близко к 1RM), кг"
        min={0}
        max={500}
        step="0.5"
        value={baseline?.squatKg ?? ''}
        onChange={(e) => set('squatKg', e.target.value)}
      />
      <Input
        type="number"
        label="Жим лёжа, кг"
        min={0}
        max={500}
        step="0.5"
        value={baseline?.benchKg ?? ''}
        onChange={(e) => set('benchKg', e.target.value)}
      />
      <Input
        type="number"
        label="Становая, кг"
        min={0}
        max={500}
        step="0.5"
        value={baseline?.deadliftKg ?? ''}
        onChange={(e) => set('deadliftKg', e.target.value)}
      />
      <Input
        type="number"
        label="Подтягивания (макс. повторов)"
        min={0}
        max={100}
        value={baseline?.pullUpsMaxReps ?? ''}
        onChange={(e) => set('pullUpsMaxReps', e.target.value)}
      />
    </div>
  );
}
