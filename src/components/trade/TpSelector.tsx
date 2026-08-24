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
            'rounded-[10px] border px-3 py-1.5 text-[11px] font-semibold',
            value.toUpperCase() === tp.label.toUpperCase()
              ? 'border-tm-gold bg-tm-gold/10 text-tm-gold'
              : 'border-tm-border bg-tm-bg text-tm-muted',
          )}
        >
          {tp.label}
        </button>
      ))}
    </div>
  );
}
