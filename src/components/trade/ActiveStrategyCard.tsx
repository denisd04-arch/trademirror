import { Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTrade } from '../../contexts/TradeContext';
import { formatRiskPercent } from '../../utils';

export function ActiveStrategyCard() {
  const { user } = useAuth();
  const { activeStrategy } = useTrade();

  if (!user || !activeStrategy) return null;

  const symbol = activeStrategy.currency === 'EUR' ? '€' : '$';

  return (
    <div className="tm-card border-tm-gold/40 bg-tm-gold/5 p-3.5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-tm-gold/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-tm-gold uppercase">
          <Check className="h-3 w-3" />
          Active
        </span>
        <span className="text-sm font-semibold text-tm-text">{activeStrategy.strategy_name}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[11px] text-tm-muted">Balance</p>
          <p className="mt-0.5 font-medium text-tm-text">
            {symbol}
            {activeStrategy.account_balance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-tm-muted">Risk</p>
          <p className="mt-0.5 font-medium text-tm-text">
            {formatRiskPercent(activeStrategy.risk_percent)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-tm-muted">Entry</p>
          <p className="mt-0.5 font-medium text-tm-text">{activeStrategy.entry_method}</p>
        </div>
        <div>
          <p className="text-[11px] text-tm-muted">Default TP</p>
          <p className="mt-0.5 font-medium text-tm-text">{activeStrategy.default_tp}</p>
        </div>
      </div>
    </div>
  );
}
