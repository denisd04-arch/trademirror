import { Link } from 'react-router-dom';
import { TradeInputPanel } from '../components/trade/TradeInputPanel';

export function HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center">
        <img
          src="/assets/trademirror-logo.svg"
          alt="TradeMirror"
          className="mx-auto h-16 w-16"
        />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          TradeMirror
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-400">
          Professional XAUUSD trading signal calculator. Upload a screenshot, paste a signal,
          or enter manually — get precise lot size, risk, and profit in seconds.
        </p>
      </section>

      <TradeInputPanel />

      <p className="text-center text-sm text-gray-500">
        No account required.{' '}
        <Link to="/register" className="text-accent-gold hover:underline">
          Create an account
        </Link>{' '}
        to save your strategies.
      </p>
    </div>
  );
}
