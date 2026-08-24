import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

const variants: Record<Variant, string> = {
  primary:
    'bg-accent-gold text-surface-950 hover:bg-accent-gold-dim font-semibold shadow-lg shadow-accent-gold/10',
  secondary:
    'bg-surface-700 text-white border border-surface-600 hover:bg-surface-600',
  ghost: 'bg-transparent text-gray-300 hover:bg-surface-800 hover:text-white',
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
