'use client';

import { CheckCircle2, Circle, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PhaseIndicator } from '@/components/dashboard/PhaseIndicator';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/errors';
import {
  useGenerateProgramMutation,
  useGetActiveProgramQuery,
} from '@/store/api/trainingApi';

export default function TrainingPage() {
  const { data: program, isLoading, error } = useGetActiveProgramQuery();
  const [generate, { isLoading: generating }] = useGenerateProgramMutation();
  const toast = useToast();

  // Найти текущую неделю: первая с незавершёнными днями
  const currentWeekNumber = useMemo(() => {
    if (!program) return 1;
    const sorted = [...program.weeks].sort((a, b) => a.weekNumber - b.weekNumber);
    for (const w of sorted) {
      if (w.days.some((d) => !d.completedAt)) return w.weekNumber;
    }
    return sorted[sorted.length - 1]?.weekNumber ?? 1;
  }, [program]);

  const [viewWeek, setViewWeek] = useState<number | null>(null);
  const week = useMemo(() => {
    if (!program) return null;
    const num = viewWeek ?? currentWeekNumber;
    return program.weeks.find((w) => w.weekNumber === num) ?? null;
  }, [program, viewWeek, currentWeekNumber]);

  const handleGenerate = async () => {
    try {
      await generate().unwrap();
      toast.success('Программа создана');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (error || !program) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Активной программы нет</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="mb-4 text-gray-600">Сгенерируйте 12-недельную программу под ваш профиль.</p>
          <Button onClick={handleGenerate} loading={generating}>
            Сгенерировать программу
          </Button>
        </CardBody>
      </Card>
    );
  }

  const activeWeek = viewWeek ?? currentWeekNumber;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{program.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            12 недель · {program.weeklyDays} дней/нед · сплит {program.splitType}
          </p>
        </div>
        {program.isLowIntensityMode && <Badge tone="warning">Низкая интенсивность</Badge>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фазы программы</CardTitle>
        </CardHeader>
        <CardBody>
          <PhaseIndicator currentWeek={currentWeekNumber} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Неделя {activeWeek}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={activeWeek <= 1}
                onClick={() => setViewWeek(activeWeek - 1)}
              >
                ←
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={activeWeek >= 12}
                onClick={() => setViewWeek(activeWeek + 1)}
              >
                →
              </Button>
              {viewWeek !== null && viewWeek !== currentWeekNumber && (
                <Button size="sm" variant="ghost" onClick={() => setViewWeek(null)}>
                  Текущая
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {week && (
            <>
              {week.description && (
                <p className="mb-3 text-sm text-gray-500">
                  {week.phase} · {week.description}
                </p>
              )}
              <div className="space-y-2">
                {week.days.map((d) => (
                  <Link
                    key={d.id}
                    href={`/training/day/${d.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {d.completedAt ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : d.startedAt ? (
                        <PlayCircle className="h-5 w-5 text-amber-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium">
                          День {d.dayNumber}: {d.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {d.exercises.length} упражнений
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant={d.completedAt ? 'ghost' : 'primary'}>
                      {d.completedAt ? 'Открыть' : d.startedAt ? 'Продолжить' : 'Начать'}
                    </Button>
                  </Link>
                ))}
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
