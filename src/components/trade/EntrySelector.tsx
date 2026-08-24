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
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            'rounded-xl border px-4 py-2 text-sm font-medium transition',
            value === option
              ? 'border-accent-gold bg-accent-gold/15 text-accent-gold'
              : 'border-surface-600 bg-surface-800 text-gray-300 hover:border-surface-500',
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
