'use client';

import { Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  defaultSeconds: number;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function WorkoutTimer({ defaultSeconds }: Props) {
  const [remaining, setRemaining] = useState(defaultSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="text-2xl font-bold tabular-nums text-gray-900">
        {formatTime(remaining)}
      </div>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setRunning((r) => !r)}
          aria-label={running ? 'Пауза' : 'Старт'}
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setRemaining(defaultSeconds);
            setRunning(false);
          }}
          aria-label="Сброс"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
