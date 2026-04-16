'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/errors';
import { useActOnAlertMutation, useDismissAlertMutation } from '@/store/api/alertsApi';
import { Alert } from '@/types';

interface Props {
  alert: Alert;
}

export function AlertBanner({ alert }: Props) {
  const toast = useToast();
  const [actOn, { isLoading: acting }] = useActOnAlertMutation();
  const [dismiss, { isLoading: dismissing }] = useDismissAlertMutation();

  const handleAct = async () => {
    try {
      const result = await actOn(alert.id).unwrap();
      toast.success(result.performedAction);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDismiss = async () => {
    try {
      await dismiss(alert.id).unwrap();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const bg =
    alert.severity === 'critical'
      ? 'border-red-300 bg-red-50'
      : alert.severity === 'warning'
        ? 'border-amber-300 bg-amber-50'
        : 'border-blue-300 bg-blue-50';

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${bg}`}>
      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
      <div className="flex-1">
        <p className="font-semibold text-gray-900">{alert.title}</p>
        <p className="mt-1 text-sm text-gray-700">{alert.message}</p>
        <p className="mt-2 text-sm font-medium text-gray-800">{alert.recommendation}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Button size="sm" onClick={handleAct} loading={acting}>
          Применить
        </Button>
        <Button size="sm" variant="ghost" onClick={handleDismiss} loading={dismissing}>
          Скрыть
        </Button>
      </div>
    </div>
  );
}
