import type { ReactNode } from 'react';
import { cn } from '../../utils';

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-surface-600/80 bg-surface-900/90 p-5 shadow-xl backdrop-blur',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn('mb-4 text-sm font-semibold tracking-wide text-gray-400 uppercase', className)}>
      {children}
    </h2>
  );
}
