'use client';

import { CheckboxGroup, RadioGroup } from '@/components/forms/RadioGroup';
import { EquipmentAccess, InjuryFlag } from '@/types';

interface Props {
  equipmentAccess: EquipmentAccess | undefined;
  injuryPainFlags: InjuryFlag[] | undefined;
  onChange: (data: { equipmentAccess?: EquipmentAccess; injuryPainFlags?: InjuryFlag[] }) => void;
}

export function StepEquipment({ equipmentAccess, injuryPainFlags, onChange }: Props) {
  return (
    <div className="space-y-5">
      <RadioGroup<EquipmentAccess>
        label="Доступное оборудование"
        value={equipmentAccess ?? null}
        onChange={(v) => onChange({ equipmentAccess: v })}
        options={[
          { value: 'bodyweight', label: 'Только своё тело' },
          { value: 'home_dumbbells', label: 'Дома гантели/резинки' },
          { value: 'gym', label: 'Тренажёрный зал' },
          { value: 'advanced_gym', label: 'Зал + специализированное' },
        ]}
      />
      <CheckboxGroup<InjuryFlag>
        label="Травмы / болевые зоны (множественный выбор)"
        values={injuryPainFlags ?? []}
        onChange={(v) => onChange({ injuryPainFlags: v.length === 0 ? ['none'] : v })}
        options={[
          { value: 'none', label: 'Нет' },
          { value: 'shoulder', label: 'Плечо' },
          { value: 'knee', label: 'Колено' },
          { value: 'hip', label: 'Бедро' },
          { value: 'lower_back', label: 'Поясница' },
          { value: 'neck', label: 'Шея' },
          { value: 'wrist', label: 'Запястье' },
          { value: 'ankle', label: 'Лодыжка' },
        ]}
      />
    </div>
  );
}
