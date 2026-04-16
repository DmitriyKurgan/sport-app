'use client';

import { Bell, CheckCircle2 } from 'lucide-react';
import { AlertBanner } from '@/components/dashboard/AlertBanner';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/errors';
import {
  useGetActiveAlertsQuery,
  useRunDetectorsMutation,
} from '@/store/api/alertsApi';

export default function AlertsPage() {
  const { data: alerts = [], isLoading, refetch } = useGetActiveAlertsQuery();
  const [runDetectors, { isLoading: running }] = useRunDetectorsMutation();
  const toast = useToast();

  const handleRun = async () => {
    try {
      const result = await runDetectors().unwrap();
      toast.success(
        result.created.length > 0
          ? `Создано новых алертов: ${result.created.length}`
          : 'Новых алертов нет — всё ок',
      );
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Алерты</h1>
        <Button onClick={handleRun} loading={running} variant="ghost" size="sm">
          Запустить детекторы
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-32" />
      ) : alerts.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="font-medium">Активных алертов нет</p>
            <p className="text-sm text-gray-500">
              Система мониторит прогресс — если что-то пойдёт не так, уведомим.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <AlertBanner key={a.id} alert={a} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Что отслеживается</CardTitle>
        </CardHeader>
        <CardBody>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2">
              <Bell className="h-4 w-4 flex-shrink-0 text-amber-500" />
              <span>
                <b>Плато силы</b>: e1RM на main_lift не растёт ≥2 недель при хорошей регулярности
              </span>
            </li>
            <li className="flex gap-2">
              <Bell className="h-4 w-4 flex-shrink-0 text-red-500" />
              <span>
                <b>Регресс</b>: падение e1RM &gt;5% + растущий session-RPE
              </span>
            </li>
            <li className="flex gap-2">
              <Bell className="h-4 w-4 flex-shrink-0 text-blue-500" />
              <span>
                <b>Плато веса на cut</b>: вес не меняется ≥14 дней
              </span>
            </li>
            <li className="flex gap-2">
              <Bell className="h-4 w-4 flex-shrink-0 text-red-500" />
              <span>
                <b>Перетренированность</b>: session-RPE &gt;8 три недели + сон &lt;6ч
              </span>
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
