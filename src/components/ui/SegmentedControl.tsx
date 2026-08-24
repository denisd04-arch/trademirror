import { cn } from '../../utils';

type Option<T extends string> = {
  value: T;
  label: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  columns,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: number;
}) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-[10px] border px-2 py-2.5 text-xs font-semibold transition',
            value === option.value
              ? 'border-tm-gold bg-tm-gold/10 text-tm-gold'
              : 'border-tm-border bg-tm-bg text-tm-muted',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
