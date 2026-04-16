'use client';

import { cn } from '@/lib/utils';

export type Period = '1m' | '3m' | 'program' | 'all';

interface Props {
  value: Period;
  onChange: (p: Period) => void;
}

const OPTIONS: { value: Period; label: string }[] = [
  { value: '1m', label: '1 мес' },
  { value: '3m', label: '3 мес' },
  { value: 'program', label: 'Программа' },
  { value: 'all', label: 'Всё' },
];

export function PeriodSwitcher({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-md px-3 py-1 text-xs font-medium transition-colors',
            value === opt.value
              ? 'bg-brand-600 text-white'
              : 'text-gray-600 hover:bg-gray-100',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** Конвертирует Period в количество дней (для query). 0 = "all". */
export function periodToDays(period: Period): number {
  switch (period) {
    case '1m': return 30;
    case '3m': return 90;
    case 'program': return 84; // 12 недель
    case 'all': return 365;
  }
}
