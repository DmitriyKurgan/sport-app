'use client';

import { Input } from '@/components/ui/Input';

interface Props {
  heightCm: number | undefined;
  weightKg: number | undefined;
  waistCm: number | undefined;
  onChange: (data: { heightCm?: number; weightKg?: number; waistCm?: number }) => void;
}

export function StepBodyMetrics({ heightCm, weightKg, waistCm, onChange }: Props) {
  return (
    <div className="space-y-4">
      <Input
        type="number"
        label="Рост, см"
        min={100}
        max={230}
        value={heightCm ?? ''}
        onChange={(e) =>
          onChange({ heightCm: e.target.value ? Number(e.target.value) : undefined })
        }
      />
      <Input
        type="number"
        label="Вес, кг"
        min={30}
        max={250}
        step="0.1"
        value={weightKg ?? ''}
        onChange={(e) =>
          onChange({ weightKg: e.target.value ? Number(e.target.value) : undefined })
        }
      />
      <Input
        type="number"
        label="Окружность талии, см (опц.)"
        min={40}
        max={200}
        value={waistCm ?? ''}
        onChange={(e) =>
          onChange({ waistCm: e.target.value ? Number(e.target.value) : undefined })
        }
        helperText="Улучшает точность body type scoring"
      />
    </div>
  );
}
