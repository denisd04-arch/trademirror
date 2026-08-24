import type { StrategyFormData } from '../../types';
import { SegmentedControl } from '../ui/SegmentedControl';
import { cn } from '../../utils';

const RISK_PRESETS = [0.5, 1, 1.5, 2];
const TP_OPTIONS = ['TP1', 'TP2', 'TP3', 'TP4'] as const;

export function StrategyForm({
  form,
  onChange,
  title,
  onClose,
}: {
  form: StrategyFormData;
  onChange: (form: StrategyFormData) => void;
  title: string;
  onClose: () => void;
}) {
  const currencySymbol = form.currency === 'EUR' ? '€' : '$';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-tm-text">{title}</h2>
        <button type="button" onClick={onClose} className="text-tm-muted hover:text-tm-text">
          ✕
        </button>
      </div>

      <label className="block">
        <span className="tm-label">Strategy Name</span>
        <input
          className="tm-input mt-1.5"
          value={form.strategy_name}
          onChange={(e) => onChange({ ...form, strategy_name: e.target.value })}
        />
      </label>

      <label className="block">
        <span className="tm-label">Account Size</span>
        <div className="relative mt-1.5">
          <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-tm-muted">
            {currencySymbol}
          </span>
          <input
            className="tm-input pl-7"
            type="number"
            min={1}
            value={form.account_balance}
            onChange={(e) => onChange({ ...form, account_balance: Number(e.target.value) })}
          />
        </div>
      </label>

      <div>
        <span className="tm-label">Currency</span>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {(['USD', 'EUR'] as const).map((currency) => (
            <button
              key={currency}
              type="button"
              onClick={() => onChange({ ...form, currency })}
              className={cn(
                'rounded-[10px] border py-2.5 text-sm font-semibold',
                form.currency === currency
                  ? 'border-tm-gold bg-tm-gold/10 text-tm-gold'
                  : 'border-tm-border bg-tm-bg text-tm-muted',
              )}
            >
              {currency === 'USD' ? '$ USD' : '€ EUR'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="tm-label">Risk Per Trade</span>
        <div className="mt-1.5 grid grid-cols-4 gap-2">
          {RISK_PRESETS.map((risk) => (
            <button
              key={risk}
              type="button"
              onClick={() => onChange({ ...form, risk_percent: risk })}
              className={cn(
                'rounded-[10px] border py-2 text-xs font-semibold',
                form.risk_percent === risk
                  ? 'border-tm-gold bg-tm-gold/10 text-tm-gold'
                  : 'border-tm-border bg-tm-bg text-tm-muted',
              )}
            >
              {risk}%
            </button>
          ))}
        </div>
        <div className="relative mt-2">
          <input
            className="tm-input pr-8"
            type="number"
            min={0.01}
            step={0.1}
            value={form.risk_percent}
            onChange={(e) => onChange({ ...form, risk_percent: Number(e.target.value) })}
          />
          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-tm-muted">%</span>
        </div>
      </div>

      <div>
        <span className="tm-label">Entry Method</span>
        <div className="mt-1.5">
          <SegmentedControl
            options={[
              { value: 'BEST', label: 'BEST' },
              { value: 'MIDDLE', label: 'MIDDLE' },
              { value: 'WORST', label: 'WORST' },
            ]}
            value={form.entry_method}
            onChange={(entry_method) => onChange({ ...form, entry_method })}
            columns={3}
          />
        </div>
      </div>

      <div>
        <span className="tm-label">Default Take Profit</span>
        <div className="mt-1.5">
          <SegmentedControl
            options={TP_OPTIONS.map((tp) => ({ value: tp, label: tp }))}
            value={form.default_tp as (typeof TP_OPTIONS)[number]}
            onChange={(default_tp) => onChange({ ...form, default_tp })}
            columns={4}
          />
        </div>
      </div>
    </div>
  );
}
