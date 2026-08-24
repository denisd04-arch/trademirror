import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Strategy, TradeSettings } from '../../types';
import { cn, formatRiskPercent } from '../../utils';

function formatStrategyLine(strategy: Strategy) {
  const symbol = strategy.currency === 'EUR' ? '€' : '$';
  return `${symbol}${strategy.account_balance.toLocaleString()} · ${strategy.risk_percent}% · ${strategy.entry_method} · ${strategy.default_tp}`;
}

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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const active = strategies.find((s) => s.id === activeStrategyId);
  const label = isGuest ? 'Guest Account' : (active?.strategy_name ?? 'Select account');

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div
      ref={ref}
      className="sticky top-14 z-40 -mx-4 border-b border-tm-border bg-tm-bg/95 px-4 py-2.5 backdrop-blur-md"
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg border border-tm-border bg-tm-card px-3 py-2.5"
        >
          <div className="min-w-0 text-left">
            <p className="tm-section-title">Account</p>
            <p className="truncate text-sm font-semibold text-tm-text">{label}</p>
            {!isGuest && active && (
              <p className="truncate text-xs text-tm-muted">{formatStrategyLine(active)}</p>
            )}
            {isGuest && (
              <p className="text-xs text-tm-muted">
                {guestSettings.currency === 'EUR' ? '€' : '$'}
                {guestSettings.accountBalance.toLocaleString()} · {formatRiskPercent(guestSettings.riskPercent)}
              </p>
            )}
          </div>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-tm-muted transition', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute left-0 right-0 mt-2 overflow-hidden rounded-xl border border-tm-border bg-tm-card shadow-2xl">
            {isGuest ? (
              <div className="space-y-3 p-3">
                <GuestField label="Currency">
                  <select
                    className="tm-input"
                    value={guestSettings.currency}
                    onChange={(e) => onGuestChange({ currency: e.target.value as 'USD' | 'EUR' })}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </GuestField>
                <GuestField label="Balance">
                  <input
                    className="tm-input"
                    type="number"
                    min={1}
                    value={guestSettings.accountBalance}
                    onChange={(e) => onGuestChange({ accountBalance: Number(e.target.value) })}
                  />
                </GuestField>
                <GuestField label="Risk %">
                  <input
                    className="tm-input"
                    type="number"
                    min={0.01}
                    step={0.1}
                    value={guestSettings.riskPercent}
                    onChange={(e) => onGuestChange({ riskPercent: Number(e.target.value) })}
                  />
                </GuestField>
                <GuestField label="Entry Method">
                  <select
                    className="tm-input"
                    value={guestSettings.entryMethod}
                    onChange={(e) =>
                      onGuestChange({ entryMethod: e.target.value as 'BEST' | 'MIDDLE' | 'WORST' })
                    }
                  >
                    <option value="BEST">Best</option>
                    <option value="MIDDLE">Middle</option>
                    <option value="WORST">Worst</option>
                  </select>
                </GuestField>
              </div>
            ) : (
              <>
                <div className="border-b border-tm-border px-3 py-2">
                  <p className="tm-section-title">Active Strategy</p>
                </div>
                <div className="max-h-56 overflow-y-auto p-1">
                  {strategies.map((strategy) => (
                    <button
                      key={strategy.id}
                      type="button"
                      onClick={() => {
                        void onSelectStrategy(strategy.id);
                        setOpen(false);
                      }}
                      className={cn(
                        'w-full rounded-lg px-3 py-2.5 text-left transition',
                        strategy.id === activeStrategyId
                          ? 'bg-accent-gold/10 ring-1 ring-accent-gold/30'
                          : 'hover:bg-tm-card-hover',
                      )}
                    >
                      <p className="text-sm font-medium">{strategy.strategy_name}</p>
                      <p className="mt-0.5 text-xs text-tm-muted">{formatStrategyLine(strategy)}</p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function GuestField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="tm-label">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
