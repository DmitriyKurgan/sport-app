'use client';

import { Trophy } from 'lucide-react';
import { useState } from 'react';
import { E1RMChart } from '@/components/charts/E1RMChart';
import { InternalLoadChart } from '@/components/charts/InternalLoadChart';
import { VolumeLoadChart } from '@/components/charts/VolumeLoadChart';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useGetExerciseAnalyticsQuery,
  useGetInternalLoadAnalyticsQuery,
  useGetVolumeAnalyticsQuery,
} from '@/store/api/analyticsApi';
import { useGetPersonalRecordsQuery } from '@/store/api/progressApi';

export default function RecordsPage() {
  const { data: records = [], isLoading: recordsLoading } = useGetPersonalRecordsQuery();
  const { data: volume = [], isLoading: volLoading } = useGetVolumeAnalyticsQuery();
  const { data: internal = [], isLoading: intLoading } = useGetInternalLoadAnalyticsQuery();

  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const { data: exerciseProgress = [], isFetching: progressLoading } =
    useGetExerciseAnalyticsQuery(selectedExercise!, { skip: !selectedExercise });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Рекорды и метрики</h1>

      <Card>
        <CardHeader>
          <CardTitle>Личные рекорды</CardTitle>
        </CardHeader>
        <CardBody>
          {recordsLoading ? (
            <Skeleton className="h-32" />
          ) : records.length === 0 ? (
            <p className="text-sm text-gray-500">PR пока нет.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {records.map((r) => (
                <button
                  key={r.exerciseId}
                  type="button"
                  onClick={() => setSelectedExercise(r.exerciseId)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    selectedExercise === r.exerciseId
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Trophy className="h-8 w-8 text-amber-500" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">
                      Exercise: {r.exerciseId.slice(0, 8)}
                    </p>
                    <p className="font-semibold">{r.prWeightKg} кг</p>
                  </div>
                  <Badge tone="success">e1RM {r.prE1rmKg.toFixed(0)}</Badge>
                </button>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {selectedExercise && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Прогресс по упражнению</CardTitle>
              <button
                type="button"
                onClick={() => setSelectedExercise(null)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                ✕ Закрыть
              </button>
            </div>
          </CardHeader>
          <CardBody>
            {progressLoading ? (
              <Skeleton className="h-64" />
            ) : (
              <E1RMChart data={exerciseProgress} />
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Volume Load по неделям</CardTitle>
        </CardHeader>
        <CardBody>
          {volLoading ? <Skeleton className="h-64" /> : <VolumeLoadChart data={volume} />}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Internal Load (session-RPE × длительность)</CardTitle>
        </CardHeader>
        <CardBody>
          {intLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <InternalLoadChart data={internal} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
