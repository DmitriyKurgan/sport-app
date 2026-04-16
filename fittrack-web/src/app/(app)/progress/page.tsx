'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BodyCompositionChart } from '@/components/charts/BodyCompositionChart';
import { Period, PeriodSwitcher, periodToDays } from '@/components/charts/PeriodSwitcher';
import { WeightChart } from '@/components/charts/WeightChart';
import { BodyMeasurementForm } from '@/components/progress/BodyMeasurementForm';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGetBodyAnalyticsQuery } from '@/store/api/analyticsApi';
import {
  useGetMeasurementsQuery,
  useGetWeightTrendQuery,
} from '@/store/api/progressApi';

export default function ProgressPage() {
  const [period, setPeriod] = useState<Period>('3m');
  const days = periodToDays(period);

  const { data: measurements = [], isLoading: measLoading } = useGetMeasurementsQuery();
  const { data: weightTrend = [], isLoading: trendLoading } = useGetWeightTrendQuery({ days });
  const { data: bodyComposition = [], isLoading: bodyLoading } = useGetBodyAnalyticsQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Прогресс</h1>
        <Link href="/progress/records">
          <Button variant="ghost">Рекорды →</Button>
        </Link>
      </div>

      <BodyMeasurementForm />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Динамика веса</CardTitle>
            <PeriodSwitcher value={period} onChange={setPeriod} />
          </div>
        </CardHeader>
        <CardBody>
          {trendLoading ? <Skeleton className="h-64" /> : <WeightChart data={weightTrend} />}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Обхваты тела</CardTitle>
        </CardHeader>
        <CardBody>
          {bodyLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <BodyCompositionChart data={bodyComposition} />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>История замеров</CardTitle>
        </CardHeader>
        <CardBody>
          {measLoading ? (
            <Skeleton className="h-32" />
          ) : measurements.length === 0 ? (
            <p className="text-sm text-gray-500">Замеров пока нет.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500">
                  <tr className="border-b border-gray-200">
                    <th className="py-2 text-left">Дата</th>
                    <th className="py-2 text-right">Вес</th>
                    <th className="py-2 text-right">Жир%</th>
                    <th className="py-2 text-right">Талия</th>
                    <th className="py-2 text-right">Грудь</th>
                    <th className="py-2 text-right">Бицепс</th>
                  </tr>
                </thead>
                <tbody>
                  {measurements.slice(0, 15).map((m) => (
                    <tr key={m.id} className="border-b border-gray-100">
                      <td className="py-2">
                        {new Date(m.measuredAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-2 text-right font-medium">{m.weightKg}</td>
                      <td className="py-2 text-right">{m.bodyFatPercent ?? '—'}</td>
                      <td className="py-2 text-right">{m.waistCm ?? '—'}</td>
                      <td className="py-2 text-right">{m.chestCm ?? '—'}</td>
                      <td className="py-2 text-right">{m.bicepsCm ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
