import { Navigate } from 'react-router-dom';
import { useTrade } from '../contexts/TradeContext';
import { TradeResultView } from '../components/trade/TradeResultView';
import { TradeInputPanel } from '../components/trade/TradeInputPanel';

export function TradePage() {
  const { signal } = useTrade();

  if (!signal) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Trade Calculator</h1>
        <TradeInputPanel />
      </div>
    );
  }

  return <TradeResultView />;
}

export function TradeRedirect() {
  return <Navigate to="/trade" replace />;
}
