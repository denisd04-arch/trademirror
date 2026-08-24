import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTrade } from '../../contexts/TradeContext';
import type { Strategy } from '../../types';
import { cn } from '../../utils';

function formatStrategyLine(strategy: Strategy) {
  const symbol = strategy.currency === 'EUR' ? '€' : '$';
  return `${symbol}${strategy.account_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · ${strategy.risk_percent}% · ${strategy.entry_method} · ${strategy.default_tp}`;
}

export function StrategySelector() {
  const { user } = useAuth();
  const { strategies, activeStrategyId, selectStrategy } = useTrade();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const active = strategies.find((s) => s.id === activeStrategyId);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[140px] items-center gap-1 rounded-[10px] border border-tm-border bg-tm-card px-2.5 py-1.5 sm:max-w-[180px]"
      >
        <span className="truncate text-xs font-semibold text-tm-gold">
          {active?.strategy_name ?? 'Select'}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-tm-gold transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-[14px] border border-tm-border bg-tm-card shadow-2xl">
          <div className="border-b border-tm-border px-3 py-2">
            <p className="tm-section-title">Active Strategy</p>
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5">
            {strategies.length === 0 ? (
              <p className="px-3 py-4 text-sm text-tm-muted">No strategies yet</p>
            ) : (
              strategies.map((strategy) => {
                const isActive = strategy.id === activeStrategyId;
                return (
                  <button
                    key={strategy.id}
                    type="button"
                    onClick={() => {
                      void selectStrategy(strategy.id);
                      setOpen(false);
                    }}
                    className={cn(
                      'w-full rounded-[10px] px-3 py-2.5 text-left transition',
                      isActive
                        ? 'border border-tm-gold/50 bg-tm-gold/10'
                        : 'border border-transparent hover:bg-tm-card-hover',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-tm-text">{strategy.strategy_name}</p>
                      {isActive && <Check className="h-4 w-4 text-tm-gold" />}
                    </div>
                    <p className="mt-0.5 text-xs text-tm-muted">{formatStrategyLine(strategy)}</p>
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t border-tm-border p-2">
            <Link
              to="/strategies"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm text-tm-gold hover:bg-tm-card-hover"
            >
              <Settings className="h-4 w-4" />
              Manage strategies
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-tm-border bg-tm-bg/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[430px] items-center justify-between gap-2 px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img src="/assets/trademirror-logo.svg" alt="TradeMirror" className="h-7 w-7 shrink-0" />
          <span className="truncate text-sm font-semibold text-tm-text">TradeMirror</span>
        </Link>

        <div className="flex items-center gap-2">
          <StrategySelector />
          {user ? (
            <Link
              to="/account"
              className="rounded-[10px] p-2 text-tm-muted transition hover:bg-tm-card hover:text-tm-text"
              aria-label="Account settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
          ) : (
            <Link to="/login" className="text-sm text-tm-muted transition hover:text-tm-text">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-tm-bg">
      <Header />
      <main className="mx-auto max-w-[430px] px-4 py-4">{children}</main>
    </div>
  );
}
