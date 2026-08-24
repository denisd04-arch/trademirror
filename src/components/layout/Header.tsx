import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTrade } from '../../contexts/TradeContext';
import type { Strategy } from '../../types';
import { cn } from '../../utils';

function formatStrategyLine(strategy: Strategy) {
  const symbol = strategy.currency === 'EUR' ? '€' : '$';
  return `${symbol}${strategy.account_balance.toLocaleString()} · ${strategy.risk_percent}% · ${strategy.entry_method} · ${strategy.default_tp}`;
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
        className="flex max-w-[220px] items-center gap-1.5 rounded-lg border border-tm-border bg-tm-card px-2.5 py-1.5 text-left sm:max-w-xs"
      >
        <span className="truncate text-sm font-medium text-tm-text">
          {active?.strategy_name ?? 'Select account'}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-tm-muted transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-tm-border bg-tm-card shadow-2xl">
          <div className="border-b border-tm-border px-3 py-2">
            <p className="tm-section-title">Active Strategy</p>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {strategies.length === 0 ? (
              <p className="px-3 py-4 text-sm text-tm-muted">No strategies yet</p>
            ) : (
              strategies.map((strategy) => (
                <button
                  key={strategy.id}
                  type="button"
                  onClick={() => {
                    void selectStrategy(strategy.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full rounded-lg px-3 py-2.5 text-left transition',
                    strategy.id === activeStrategyId
                      ? 'bg-accent-gold/10 ring-1 ring-accent-gold/30'
                      : 'hover:bg-tm-card-hover',
                  )}
                >
                  <p className="text-sm font-medium text-tm-text">{strategy.strategy_name}</p>
                  <p className="mt-0.5 text-xs text-tm-muted">{formatStrategyLine(strategy)}</p>
                </button>
              ))
            )}
          </div>
          <div className="border-t border-tm-border p-2">
            <Link
              to="/strategies"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-accent-gold hover:bg-tm-card-hover"
            >
              Manage strategies
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-tm-border bg-tm-bg/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-3 px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img src="/assets/trademirror-logo.svg" alt="TradeMirror" className="h-7 w-7 shrink-0" />
          <span className="truncate text-sm font-semibold tracking-tight text-tm-text">
            TradeMirror
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <StrategySelector />
          {user ? (
            <>
              <Link
                to="/account"
                className="rounded-lg p-2 text-tm-muted transition hover:bg-tm-card hover:text-tm-text"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="text-sm text-tm-muted transition hover:text-tm-text"
              >
                Logout
              </button>
            </>
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
      <main className="mx-auto max-w-lg px-4 py-5">{children}</main>
    </div>
  );
}
