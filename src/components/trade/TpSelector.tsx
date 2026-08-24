import type { TakeProfit } from '../../types';
import { cn } from '../../utils';

export function TpSelector({
  takeProfits,
  value,
  onChange,
}: {
  takeProfits: TakeProfit[];
  value: string;
  onChange: (label: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {takeProfits.map((tp) => (
        <button
          key={tp.label}
          type="button"
          onClick={() => onChange(tp.label)}
          className={cn(
            'rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
            value.toUpperCase() === tp.label.toUpperCase()
              ? 'border-accent-gold bg-accent-gold/10 text-accent-gold'
              : 'border-tm-border bg-tm-card text-tm-muted',
          )}
        >
          {tp.label}
        </button>
      ))}
    </div>
  );
}
