import type { InputHTMLAttributes } from 'react';
import { cn } from '../../utils';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <label className="flex w-full flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium text-gray-300">{label}</span>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-xl border border-surface-600 bg-surface-800 px-4 py-3 text-white outline-none transition focus:border-accent-gold/60 focus:ring-2 focus:ring-accent-gold/20',
          error && 'border-loss',
          className,
        )}
        {...props}
      />
      {error && <span className="text-sm text-loss">{error}</span>}
    </label>
  );
}
