'use client';

import { Pill } from 'lucide-react';
import { useMemo, useState } from 'react';
import { MacrosChart } from '@/components/charts/MacrosChart';
import { RadioGroup } from '@/components/forms/RadioGroup';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/errors';
import {
  useGeneratePlanMutation,
  useGetPlanQuery,
  useUpdatePlanMutation,
} from '@/store/api/nutritionApi';
import { DayTemplate, NutritionTier } from '@/types';

const tierLabel: Record<NutritionTier, string> = {
  budget: 'Бюджет',
  standard: 'Стандарт',
  advanced: 'Продвинутый',
};

const dayTypeLabel: Record<DayTemplate, string> = {
  training_day: 'Тренировочный день',
  rest_day: 'День отдыха',
  heavy_training_day: 'Тяжёлая тренировка',
};

export default function NutritionPage() {
  const { data: plan, isLoading, error } = useGetPlanQuery();
  const [generatePlan, { isLoading: generating }] = useGeneratePlanMutation();
  const [updatePlan, { isLoading: updating }] = useUpdatePlanMutation();
  const toast = useToast();
  const [dayType, setDayType] = useState<DayTemplate>('training_day');

  const filteredMeals = useMemo(
    () => (plan?.meals ?? []).filter((m) => m.dayType === dayType).sort((a, b) => a.orderIndex - b.orderIndex),
    [plan, dayType],
  );

  if (isLoading) return <Skeleton className="h-64" />;

  if (error || !plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>План питания не создан</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="mb-4 text-gray-600">Сгенерируйте план под ваш профиль и цель.</p>
          <Button
            onClick={async () => {
              try {
                await generatePlan().unwrap();
                toast.success('План питания готов');
              } catch (err) {
                toast.error(getErrorMessage(err));
              }
            }}
            loading={generating}
          >
            Сгенерировать
          </Button>
        </CardBody>
      </Card>
    );
  }

  const handleTierChange = async (tier: NutritionTier) => {
    if (tier === plan.tier) return;
    try {
      await updatePlan({ id: plan.id, body: { tier } }).unwrap();
      toast.success(`Тир изменён: ${tierLabel[tier]}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Питание</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs text-gray-500">Калории/день</p>
            <p className="mt-1 text-3xl font-bold">{plan.caloriesTarget}</p>
            <p className="mt-1 text-xs text-gray-500">цель: {plan.bodyweightGoal}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-gray-500">Белок</p>
            <p className="mt-1 text-3xl font-bold">{plan.proteinG} г</p>
            <p className="mt-1 text-xs text-gray-500">≈ {plan.proteinPerMealG} г / приём</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Распределение БЖУ</CardTitle>
          </CardHeader>
          <CardBody>
            <MacrosChart proteinG={plan.proteinG} fatG={plan.fatG} carbsG={plan.carbsG} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Тир питания</CardTitle>
        </CardHeader>
        <CardBody>
          <RadioGroup<NutritionTier>
            value={plan.tier}
            onChange={handleTierChange}
            options={[
              { value: 'budget', label: 'Бюджет', description: 'Минимум денег, простые продукты' },
              { value: 'standard', label: 'Стандарт', description: 'Разнообразие' },
              { value: 'advanced', label: 'Продвинутый', description: 'Тайминг + добавки' },
            ]}
            columns={3}
          />
          {updating && <p className="mt-2 text-xs text-gray-500">Обновляем план…</p>}
        </CardBody>
      </Card>

      {plan.supplements && plan.supplements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Добавки</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {plan.supplements.map((s, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
                  <Pill className="h-5 w-5 text-brand-600" />
                  <div>
                    <p className="font-medium">
                      {s.name} <Badge tone="info">{s.dose}</Badge>
                    </p>
                    {s.notes && <p className="mt-1 text-xs text-gray-600">{s.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Меню</CardTitle>
            <Badge tone="info">{tierLabel[plan.tier]}</Badge>
          </div>
        </CardHeader>
        <CardBody>
          <div className="mb-4">
            <RadioGroup<DayTemplate>
              value={dayType}
              onChange={setDayType}
              options={[
                { value: 'training_day', label: dayTypeLabel.training_day },
                { value: 'rest_day', label: dayTypeLabel.rest_day },
                { value: 'heavy_training_day', label: dayTypeLabel.heavy_training_day },
              ]}
              columns={3}
            />
          </div>
          {filteredMeals.length === 0 ? (
            <p className="text-sm text-gray-500">Для этого типа дня нет меню в текущем тире.</p>
          ) : (
            <div className="space-y-3">
              {filteredMeals.map((m) => (
                <div key={m.template.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{m.template.name}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {m.template.calories} ккал · Б{m.template.proteinG} / Ж{m.template.fatG} / У{m.template.carbsG}
                      </p>
                    </div>
                    <Badge>{m.template.mealType}</Badge>
                  </div>
                  {m.template.ingredients.length > 0 && (
                    <ul className="mt-2 text-xs text-gray-600">
                      {m.template.ingredients.map((ing, i) => (
                        <li key={i}>
                          • {ing.name} — {ing.amount} {ing.unit}
                        </li>
                      ))}
                    </ul>
                  )}
                  {m.template.instructions && (
                    <p className="mt-2 text-xs italic text-gray-500">{m.template.instructions}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
