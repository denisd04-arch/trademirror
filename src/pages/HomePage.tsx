import { ActiveStrategyCard } from '../components/trade/ActiveStrategyCard';
import { TradeInputPanel } from '../components/trade/TradeInputPanel';

export function HomePage() {
  return (
    <div className="space-y-4">
      <section className="text-center">
        <h1 className="text-[1.35rem] font-bold tracking-tight text-tm-text">Input your trade</h1>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-tm-muted">
          Enter the trade details to get an exact lot size, risk and SL loss. Take profits are
          optional — add them any time after calculating.
        </p>
      </section>

      <ActiveStrategyCard />

      <TradeInputPanel />

      <p className="px-2 text-center text-[11px] leading-relaxed text-tm-muted">
        Calculation &amp; visualization tool only. Does not place trades, connect to a broker, or
        provide financial advice.
      </p>
    </div>
  );
}
