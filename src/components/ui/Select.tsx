import type { SelectHTMLAttributes } from 'react';
import { cn } from '../../utils';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export function Select({ label, error, className, id, children, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <label className="flex w-full flex-col gap-1.5">
      {label && <span className="tm-label">{label}</span>}
      <select
        id={selectId}
        className={cn('tm-input', error && 'border-loss', className)}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-sm text-loss">{error}</span>}
    </label>
  );
}
