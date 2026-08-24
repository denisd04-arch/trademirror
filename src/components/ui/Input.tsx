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
      {label && <span className="tm-label">{label}</span>}
      <input
        id={inputId}
        className={cn('tm-input', error && 'border-loss', className)}
        {...props}
      />
      {error && <span className="text-sm text-loss">{error}</span>}
    </label>
  );
}
