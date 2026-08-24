import { Navigate } from 'react-router-dom';
import { useTrade } from '../contexts/TradeContext';
import { TradeResultView } from '../components/trade/TradeResultView';
import { TradeInputPanel } from '../components/trade/TradeInputPanel';

export function TradePage() {
  const { signal } = useTrade();

  if (!signal) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-tm-text">Input your trade</h1>
          <p className="mt-1 text-sm text-tm-muted">Upload, paste, or manually enter a signal.</p>
        </div>
        <TradeInputPanel />
      </div>
    );
  }

  return <TradeResultView />;
}

export function TradeRedirect() {
  return <Navigate to="/trade" replace />;
}
