'use client';

import { cn } from '@/lib/utils';

interface RadioOption<T extends string | number> {
  value: T;
  label: string;
  description?: string;
}

interface RadioGroupProps<T extends string | number> {
  label?: string;
  value: T | null;
  onChange: (v: T) => void;
  options: RadioOption<T>[];
  columns?: 1 | 2 | 3;
}

export function RadioGroup<T extends string | number>({
  label,
  value,
  onChange,
  options,
  columns = 1,
}: RadioGroupProps<T>) {
  const colClass = columns === 3 ? 'sm:grid-cols-3' : columns === 2 ? 'sm:grid-cols-2' : '';
  return (
    <div>
      {label && <p className="mb-2 text-sm font-medium text-gray-700">{label}</p>}
      <div className={cn('grid grid-cols-1 gap-2', colClass)}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                selected
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-200 bg-white hover:bg-gray-50',
              )}
            >
              <div className="font-medium">{opt.label}</div>
              {opt.description && (
                <div className="mt-0.5 text-xs text-gray-500">{opt.description}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface CheckboxGroupProps<T extends string> {
  label?: string;
  values: T[];
  onChange: (v: T[]) => void;
  options: RadioOption<T>[];
}

export function CheckboxGroup<T extends string>({
  label,
  values,
  onChange,
  options,
}: CheckboxGroupProps<T>) {
  const toggle = (v: T) => {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else onChange([...values, v]);
  };

  return (
    <div>
      {label && <p className="mb-2 text-sm font-medium text-gray-700">{label}</p>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((opt) => {
          const selected = values.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm transition-colors',
                selected
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-200 bg-white hover:bg-gray-50',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
