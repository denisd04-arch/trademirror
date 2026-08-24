import { Navigate } from 'react-router-dom';
import { useTrade } from '../contexts/TradeContext';
import { TradeResultView } from '../components/trade/TradeResultView';
import { TradeInputPanel } from '../components/trade/TradeInputPanel';

export function TradePage() {
  const { signal } = useTrade();

  if (!signal) {
    return (
      <div className="space-y-4">
        <section className="text-center">
          <h1 className="text-[1.35rem] font-bold text-tm-text">Input your trade</h1>
          <p className="mx-auto mt-2 max-w-sm text-[13px] text-tm-muted">
            Upload, paste, or manually enter a signal.
          </p>
        </section>
        <TradeInputPanel />
      </div>
    );
  }

  return <TradeResultView />;
}

export function TradeRedirect() {
  return <Navigate to="/trade" replace />;
}
