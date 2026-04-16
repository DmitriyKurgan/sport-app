'use client';

import { cn } from '@/lib/utils';

const RIR_HINTS: Record<number, string> = {
  0: 'до отказа',
  1: '1 в запасе',
  2: '2 в запасе',
  3: '3 в запасе',
  4: 'легко',
  5: 'очень легко',
};

interface Props {
  value: number | null;
  onChange: (v: number | null) => void;
  target?: number;
}

export function RIRPicker({ value, onChange, target }: Props) {
  return (
    <div>
      <p className="mb-1 text-xs text-gray-500">RIR{target !== undefined && ` (цель ${target})`}</p>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4, 5].map((n) => {
          const selected = value === n;
          const isTarget = target === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(selected ? null : n)}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-md border text-sm font-semibold transition-colors',
                selected
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : isTarget
                    ? 'border-brand-300 bg-brand-50 text-brand-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
              )}
              title={RIR_HINTS[n]}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
