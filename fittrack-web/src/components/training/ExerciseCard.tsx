'use client';

import { Check, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { RIRPicker } from '@/components/training/RIRPicker';
import { WorkoutTimer } from '@/components/training/WorkoutTimer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/errors';
import { useGetLogsByExerciseQuery } from '@/store/api/progressApi';
import { useLogSetMutation } from '@/store/api/progressApi';
import { DayExercise } from '@/types';

interface Props {
  exercise: DayExercise;
  trainingDayId: string;
}

interface SetState {
  weight: string;
  reps: string;
  rir: number | null;
  isWarmup: boolean;
  logged: boolean;
}

const emptySet: SetState = {
  weight: '',
  reps: '',
  rir: null,
  isWarmup: false,
  logged: false,
};

export function ExerciseCard({ exercise, trainingDayId }: Props) {
  const toast = useToast();
  const [logSet, { isLoading: logging }] = useLogSetMutation();
  const { data: history = [] } = useGetLogsByExerciseQuery(exercise.exerciseId);

  const [sets, setSets] = useState<SetState[]>(() =>
    Array.from({ length: exercise.sets }, () => ({ ...emptySet })),
  );

  const lastSession = history[history.length - 1];

  const updateSet = (idx: number, patch: Partial<SetState>) => {
    setSets((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const handleLog = async (idx: number) => {
    const set = sets[idx];
    const weight = parseFloat(set.weight);
    const reps = parseInt(set.reps, 10);
    if (!weight || !reps) {
      toast.error('Заполните вес и повторы');
      return;
    }
    try {
      await logSet({
        exerciseId: exercise.exerciseId,
        trainingDayId,
        dayExerciseId: exercise.id,
        setNumber: idx + 1,
        weightKg: weight,
        reps,
        rir: set.rir ?? undefined,
        isWarmup: set.isWarmup,
      }).unwrap();
      updateSet(idx, { logged: true });
      toast.success(`Подход ${idx + 1} записан`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{exercise.exerciseName}</h3>
              <a
                href={exercise.videoSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-100"
                title="Видео техники на YouTube"
              >
                <PlayCircle className="h-3.5 w-3.5" />
                Видео
              </a>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {exercise.sets}×{exercise.repsMin}-{exercise.repsMax} @ RIR {exercise.targetRir ?? '—'}
              {exercise.targetLoadKg && ` · ${exercise.targetLoadKg} кг`}
            </p>
          </div>
          <Badge tone={exercise.role === 'main_lift' ? 'info' : 'default'}>
            {exercise.role === 'main_lift' ? 'Базовое' : 'Аксессуар'}
          </Badge>
        </div>
      </CardHeader>
      <CardBody className="space-y-3">
        {lastSession && (
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
            Прошлый раз: {lastSession.weightKg} кг × {lastSession.reps}
            {lastSession.rir !== null && ` @ RIR ${lastSession.rir}`}
          </div>
        )}

        {sets.map((set, idx) => (
          <div
            key={idx}
            className="grid grid-cols-12 items-end gap-2 rounded-lg border border-gray-200 p-3"
          >
            <div className="col-span-1 self-center text-sm font-semibold text-gray-500">
              #{idx + 1}
            </div>
            <div className="col-span-3">
              <Input
                type="number"
                step="0.5"
                placeholder="Вес"
                value={set.weight}
                onChange={(e) => updateSet(idx, { weight: e.target.value })}
                disabled={set.logged}
                aria-label="Вес"
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                placeholder="Повторы"
                value={set.reps}
                onChange={(e) => updateSet(idx, { reps: e.target.value })}
                disabled={set.logged}
                aria-label="Повторы"
              />
            </div>
            <div className="col-span-4">
              <RIRPicker
                value={set.rir}
                onChange={(v) => updateSet(idx, { rir: v })}
                target={exercise.targetRir ?? undefined}
              />
            </div>
            <div className="col-span-2">
              {set.logged ? (
                <Button size="sm" variant="ghost" disabled fullWidth>
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  fullWidth
                  loading={logging}
                  onClick={() => handleLog(idx)}
                >
                  Записать
                </Button>
              )}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3">
          <WorkoutTimer defaultSeconds={exercise.restSeconds} />
          <span className="text-xs text-gray-500">
            Отдых {exercise.restSeconds}с между подходами
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
