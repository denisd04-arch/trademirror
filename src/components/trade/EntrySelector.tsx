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
            'rounded-[10px] border py-2 text-[11px] font-semibold tracking-wide',
            value === option
              ? 'border-tm-gold bg-tm-gold/10 text-tm-gold'
              : 'border-tm-border bg-tm-bg text-tm-muted',
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
