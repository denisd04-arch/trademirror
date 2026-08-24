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
            'rounded-xl border px-4 py-2 text-sm font-medium transition',
            value.toUpperCase() === tp.label.toUpperCase()
              ? 'border-profit bg-profit/15 text-profit'
              : 'border-surface-600 bg-surface-800 text-gray-300 hover:border-surface-500',
          )}
        >
          {tp.label}
        </button>
      ))}
    </div>
  );
}
