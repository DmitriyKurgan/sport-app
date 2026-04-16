'use client';

import { cn } from '@/lib/utils';
import { ProgramPhase } from '@/types';

const PHASES: { num: number; phase: ProgramPhase; label: string }[] = [
  { num: 1, phase: 'adaptation', label: 'A' },
  { num: 2, phase: 'adaptation', label: 'A' },
  { num: 3, phase: 'adaptation', label: 'A' },
  { num: 4, phase: 'deload', label: 'D' },
  { num: 5, phase: 'accumulation', label: 'A+' },
  { num: 6, phase: 'accumulation', label: 'A+' },
  { num: 7, phase: 'accumulation', label: 'A+' },
  { num: 8, phase: 'deload', label: 'D' },
  { num: 9, phase: 'intensification', label: 'I' },
  { num: 10, phase: 'intensification', label: 'I' },
  { num: 11, phase: 'intensification', label: 'I' },
  { num: 12, phase: 'deload', label: 'D' },
];

const phaseColor: Record<ProgramPhase, string> = {
  adaptation: 'bg-blue-500',
  accumulation: 'bg-emerald-500',
  intensification: 'bg-amber-500',
  deload: 'bg-gray-400',
};

interface Props {
  currentWeek: number;
}

export function PhaseIndicator({ currentWeek }: Props) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
        <span>Адаптация</span>
        <span>Накопление</span>
        <span>Интенсификация</span>
      </div>
      <div className="flex gap-1">
        {PHASES.map((p) => {
          const isCurrent = p.num === currentWeek;
          const isPast = p.num < currentWeek;
          return (
            <div key={p.num} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  'h-8 w-full rounded text-center text-xs font-medium leading-8 text-white transition-opacity',
                  phaseColor[p.phase],
                  isCurrent ? 'ring-2 ring-brand-600 ring-offset-2' : '',
                  !isCurrent && !isPast ? 'opacity-40' : '',
                )}
              >
                {p.label}
              </div>
              <span
                className={cn(
                  'text-xs',
                  isCurrent ? 'font-bold text-brand-700' : 'text-gray-400',
                )}
              >
                {p.num}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
