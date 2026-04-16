import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id: idProp, ...rest }, ref) => {
    const reactId = useId();
    const id = idProp ?? reactId;
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'h-10 w-full rounded-lg border bg-white px-3 text-sm text-gray-900',
            'placeholder:text-gray-400',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
            'disabled:cursor-not-allowed disabled:bg-gray-50',
            hasError ? 'border-red-500' : 'border-gray-300',
            className,
          )}
          aria-invalid={hasError}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          {...rest}
        />
        {error ? (
          <p id={`${id}-error`} className="text-sm text-red-600">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${id}-helper`} className="text-sm text-gray-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';
