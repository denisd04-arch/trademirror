import type { EntryMethod } from '../../types';
import { cn } from '../../utils';

const options: EntryMethod[] = ['BEST', 'MIDDLE', 'WORST'];

export function EntrySelector({
  value,
  onChange,
  disabled,
}: {
  value: EntryMethod;
  onChange: (entry: EntryMethod) => void;
  disabled?: boolean;
}) {
  if (disabled) return null;

  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            'rounded-lg border py-2 text-xs font-semibold tracking-wide transition',
            value === option
              ? 'border-accent-gold bg-accent-gold/10 text-accent-gold'
              : 'border-tm-border bg-tm-card text-tm-muted',
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
