'use client';

import { CheckCircle2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ExerciseCard } from '@/components/training/ExerciseCard';
import { SessionRPEPrompt } from '@/components/training/SessionRPEPrompt';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/errors';
import {
  useCompleteTrainingDayMutation,
  useGetTrainingDayQuery,
  useStartTrainingDayMutation,
} from '@/store/api/trainingApi';
import { useLogSessionRPEMutation } from '@/store/api/progressApi';

export default function TrainingDayPage() {
  const { dayId } = useParams<{ dayId: string }>();
  const router = useRouter();
  const toast = useToast();

  const { data: day, isLoading } = useGetTrainingDayQuery(dayId);
  const [startDay] = useStartTrainingDayMutation();
  const [completeDay, { isLoading: completing }] = useCompleteTrainingDayMutation();
  const [logSessionRPE, { isLoading: loggingRpe }] = useLogSessionRPEMutation();

  const [showRpePrompt, setShowRpePrompt] = useState(false);
  const [startedAtClient] = useState(() => Date.now());

  // Авто-старт сессии
  useEffect(() => {
    if (day && !day.startedAt) {
      startDay(dayId).catch(() => {
        // ignore — UX продолжается
      });
    }
  }, [day, dayId, startDay]);

  if (isLoading || !day) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const handleComplete = async (data: { sessionRpe: number; durationMinutes: number }) => {
    try {
      await logSessionRPE({ trainingDayId: dayId, ...data }).unwrap();
      await completeDay(dayId).unwrap();
      toast.success('Тренировка завершена!');
      setShowRpePrompt(false);
      router.push('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const elapsedMinutes = Math.max(5, Math.round((Date.now() - startedAtClient) / 60000));

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.push('/training')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← К программе
        </button>
        <h1 className="mt-1 text-2xl font-bold">{day.name}</h1>
        <p className="text-sm text-gray-500">
          День {day.dayNumber} · {day.exercises.length} упражнений
        </p>
      </div>

      {day.completedAt ? (
        <Card className="border-green-300 bg-green-50">
          <CardBody className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <p className="font-medium text-green-900">Тренировка уже завершена</p>
          </CardBody>
        </Card>
      ) : null}

      <div className="space-y-4">
        {day.exercises.map((ex) => (
          <ExerciseCard key={ex.id} exercise={ex} trainingDayId={dayId} />
        ))}
      </div>

      {!day.completedAt && (
        <Card>
          <CardHeader>
            <CardTitle>Завершить тренировку</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="mb-3 text-sm text-gray-600">
              После записи всех подходов оцените общую тяжесть тренировки (session-RPE).
            </p>
            <Button onClick={() => setShowRpePrompt(true)} loading={completing}>
              Завершить
            </Button>
          </CardBody>
        </Card>
      )}

      <SessionRPEPrompt
        open={showRpePrompt}
        defaultDuration={elapsedMinutes}
        onClose={() => setShowRpePrompt(false)}
        onSubmit={handleComplete}
        loading={loggingRpe || completing}
      />
    </div>
  );
}
