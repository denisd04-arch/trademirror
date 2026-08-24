import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'profit';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

const variants: Record<Variant, string> = {
  primary: 'bg-accent-gold text-tm-bg hover:bg-accent-gold-dim font-semibold',
  profit: 'bg-profit text-tm-bg hover:bg-profit-dim font-semibold',
  secondary: 'bg-tm-card text-tm-text border border-tm-border hover:bg-tm-card-hover',
  ghost: 'bg-transparent text-tm-muted hover:bg-tm-card hover:text-tm-text',
  danger: 'bg-loss/15 text-loss border border-loss/30 hover:bg-loss/25',
};

export function Button({
  className,
  variant = 'primary',
  fullWidth,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
