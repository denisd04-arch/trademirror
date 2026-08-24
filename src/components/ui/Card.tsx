import type { ReactNode } from 'react';
import { cn } from '../../utils';

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('tm-card p-4', className)}>{children}</div>;
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn('tm-section-title mb-3', className)}>
      {children}
    </h2>
  );
}
