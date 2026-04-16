'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface Props {
  open: boolean;
  defaultDuration: number;
  onClose: () => void;
  onSubmit: (data: { sessionRpe: number; durationMinutes: number }) => void;
  loading?: boolean;
}

const RPE_HINTS: Record<number, string> = {
  1: 'легко',
  3: 'средне',
  5: 'тяжело',
  7: 'очень тяжело',
  9: 'на пределе',
  10: 'максимум',
};

export function SessionRPEPrompt({ open, defaultDuration, onClose, onSubmit, loading }: Props) {
  const [rpe, setRpe] = useState<number>(7);
  const [duration, setDuration] = useState(defaultDuration);

  useEffect(() => {
    if (open) {
      setRpe(7);
      setDuration(defaultDuration);
    }
  }, [open, defaultDuration]);

  return (
    <Modal open={open} onClose={onClose} title="Завершение тренировки" size="md">
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">
            Насколько тяжёлой была вся тренировка? (1–10)
          </p>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRpe(n)}
                className={`h-10 rounded text-sm font-semibold transition-colors ${
                  rpe === n
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">{RPE_HINTS[rpe] ?? '—'}</p>
        </div>
        <Input
          type="number"
          label="Длительность, мин"
          min={5}
          max={240}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button
            loading={loading}
            onClick={() => onSubmit({ sessionRpe: rpe, durationMinutes: duration })}
          >
            Завершить
          </Button>
        </div>
      </div>
    </Modal>
  );
}
