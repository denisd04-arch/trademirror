import { useMemo } from 'react';
import type { Strategy, TradeSettings } from '../../types';
import { Select } from '../ui/Select';

export function AccountSwitcher({
  strategies,
  activeStrategyId,
  guestSettings,
  isGuest,
  onSelectStrategy,
  onGuestChange,
}: {
  strategies: Strategy[];
  activeStrategyId: string | null;
  guestSettings: TradeSettings;
  isGuest: boolean;
  onSelectStrategy: (id: string) => void;
  onGuestChange: (settings: Partial<TradeSettings>) => void;
}) {
  const label = useMemo(() => {
    if (isGuest) return 'Guest Account';
    const active = strategies.find((s) => s.id === activeStrategyId);
    return active?.strategy_name ?? 'Select Strategy';
  }, [isGuest, strategies, activeStrategyId]);

  return (
    <div className="sticky top-[57px] z-40 -mx-4 border-b border-surface-700 bg-surface-900/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Account</p>
          <p className="font-semibold text-white">{label}</p>
        </div>

        {isGuest ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Select
              label="Currency"
              value={guestSettings.currency}
              onChange={(e) =>
                onGuestChange({ currency: e.target.value as 'USD' | 'EUR' })
              }
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </Select>
            <Select
              label="Balance"
              value={guestSettings.accountBalance}
              onChange={(e) =>
                onGuestChange({ accountBalance: Number(e.target.value) })
              }
            >
              {[150, 300, 1000, 5000, 10000, 100000].map((v) => (
                <option key={v} value={v}>
                  {v.toLocaleString()}
                </option>
              ))}
            </Select>
            <Select
              label="Risk %"
              value={guestSettings.riskPercent}
              onChange={(e) =>
                onGuestChange({ riskPercent: Number(e.target.value) })
              }
            >
              {[0.5, 1, 1.5, 2, 3].map((v) => (
                <option key={v} value={v}>
                  {v}%
                </option>
              ))}
            </Select>
            <Select
              label="Entry"
              value={guestSettings.entryMethod}
              onChange={(e) =>
                onGuestChange({
                  entryMethod: e.target.value as 'BEST' | 'MIDDLE' | 'WORST',
                })
              }
            >
              <option value="BEST">Best</option>
              <option value="MIDDLE">Middle</option>
              <option value="WORST">Worst</option>
            </Select>
          </div>
        ) : strategies.length > 1 ? (
          <Select
            label="Strategy"
            value={activeStrategyId ?? ''}
            onChange={(e) => onSelectStrategy(e.target.value)}
            className="sm:max-w-xs"
          >
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.strategy_name} · {s.currency === 'EUR' ? '€' : '$'}
                {s.account_balance.toLocaleString()} · {s.risk_percent}%
              </option>
            ))}
          </Select>
        ) : null}
      </div>
    </div>
  );
}
