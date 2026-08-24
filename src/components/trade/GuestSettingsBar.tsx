import type { TradeSettings } from '../../types';
import { formatRiskPercent } from '../../utils';

export function GuestSettingsBar({
  settings,
  onChange,
}: {
  settings: TradeSettings;
  onChange: (partial: Partial<TradeSettings>) => void;
}) {
  return (
    <div className="tm-card p-3">
      <p className="tm-section-title mb-2">Guest Account</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-tm-muted">
          Currency
          <select
            className="tm-input mt-1"
            value={settings.currency}
            onChange={(e) => onChange({ currency: e.target.value as 'USD' | 'EUR' })}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </label>
        <label className="text-xs text-tm-muted">
          Balance
          <input
            className="tm-input mt-1"
            type="number"
            min={1}
            value={settings.accountBalance}
            onChange={(e) => onChange({ accountBalance: Number(e.target.value) })}
          />
        </label>
        <label className="text-xs text-tm-muted">
          Risk %
          <input
            className="tm-input mt-1"
            type="number"
            min={0.01}
            step={0.1}
            value={settings.riskPercent}
            onChange={(e) => onChange({ riskPercent: Number(e.target.value) })}
          />
        </label>
        <div className="flex flex-col justify-end text-xs text-tm-muted">
          <span>Current risk</span>
          <span className="mt-1 font-medium text-tm-text">{formatRiskPercent(settings.riskPercent)}</span>
        </div>
      </div>
    </div>
  );
}
