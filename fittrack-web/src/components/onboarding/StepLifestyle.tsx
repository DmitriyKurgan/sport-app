'use client';

import { CheckboxGroup, RadioGroup } from '@/components/forms/RadioGroup';
import { Input } from '@/components/ui/Input';
import {
  DailyActivityLevel,
  DietaryRestriction,
  NutritionTier,
  StressLevel,
} from '@/types';

interface Props {
  sleepHoursAvg: number | undefined;
  stressLevel: StressLevel | undefined;
  dailyActivityLevel: DailyActivityLevel | undefined;
  nutritionTierPreference: NutritionTier | undefined;
  dietaryRestrictions: DietaryRestriction[] | undefined;
  onChange: (data: {
    sleepHoursAvg?: number;
    stressLevel?: StressLevel;
    dailyActivityLevel?: DailyActivityLevel;
    nutritionTierPreference?: NutritionTier;
    dietaryRestrictions?: DietaryRestriction[];
  }) => void;
}

export function StepLifestyle({
  sleepHoursAvg,
  stressLevel,
  dailyActivityLevel,
  nutritionTierPreference,
  dietaryRestrictions,
  onChange,
}: Props) {
  return (
    <div className="space-y-5">
      <Input
        type="number"
        step="0.5"
        min={3}
        max={12}
        label="Сон, часов в среднем"
        value={sleepHoursAvg ?? ''}
        onChange={(e) =>
          onChange({ sleepHoursAvg: e.target.value ? Number(e.target.value) : undefined })
        }
        helperText="< 6ч повышает риск перетренированности"
      />
      <RadioGroup<StressLevel>
        label="Уровень стресса"
        value={stressLevel ?? null}
        onChange={(v) => onChange({ stressLevel: v })}
        options={[
          { value: 'low', label: 'Низкий' },
          { value: 'medium', label: 'Средний' },
          { value: 'high', label: 'Высокий' },
        ]}
        columns={3}
      />
      <RadioGroup<DailyActivityLevel>
        label="Бытовая активность"
        value={dailyActivityLevel ?? null}
        onChange={(v) => onChange({ dailyActivityLevel: v })}
        options={[
          { value: 'sedentary', label: 'Сидячий', description: 'Офисная работа' },
          { value: 'moderate', label: 'Умеренный', description: 'Иногда хожу/двигаюсь' },
          { value: 'active', label: 'Активный', description: 'Много движения каждый день' },
        ]}
      />
      <RadioGroup<NutritionTier>
        label="Подход к питанию"
        value={nutritionTierPreference ?? null}
        onChange={(v) => onChange({ nutritionTierPreference: v })}
        options={[
          { value: 'budget', label: 'Бюджетный', description: 'Минимум денег, простые продукты' },
          { value: 'standard', label: 'Стандартный', description: 'Разнообразие' },
          { value: 'advanced', label: 'Продвинутый', description: 'Тайминг + добавки' },
        ]}
      />
      <CheckboxGroup<DietaryRestriction>
        label="Диетические ограничения (опц.)"
        values={dietaryRestrictions ?? []}
        onChange={(v) => onChange({ dietaryRestrictions: v })}
        options={[
          { value: 'vegetarian', label: 'Вегетарианец' },
          { value: 'vegan', label: 'Веган' },
          { value: 'halal', label: 'Халяль' },
          { value: 'kosher', label: 'Кошер' },
          { value: 'lactose_intolerance', label: 'Без лактозы' },
          { value: 'gluten_free', label: 'Без глютена' },
        ]}
      />
    </div>
  );
}
