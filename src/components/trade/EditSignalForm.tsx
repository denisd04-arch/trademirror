import { useState } from 'react';
import type { Direction, TakeProfit, TradeSignal } from '../../types';
import { cn } from '../../utils';

type EditSignalProps = {
  signal: TradeSignal;
  onSave: (signal: TradeSignal) => void;
  onCancel: () => void;
};

export function EditSignalForm({ signal, onSave, onCancel }: EditSignalProps) {
  const [direction, setDirection] = useState<Direction>(signal.direction);
  const [bestEntry, setBestEntry] = useState(signal.bestEntry?.toString() ?? '');
  const [worstEntry, setWorstEntry] = useState(signal.worstEntry?.toString() ?? '');
  const [singleEntry, setSingleEntry] = useState(signal.singleEntry?.toString() ?? '');
  const [stopLoss, setStopLoss] = useState(signal.stopLoss.toString());
  const [takeProfits, setTakeProfits] = useState<TakeProfit[]>(signal.takeProfits);
  const [error, setError] = useState('');

  const handleSave = () => {
    const sl = Number(stopLoss);
    if (!Number.isFinite(sl) || sl <= 0) {
      setError('Valid stop loss is required');
      return;
    }

    let updated: TradeSignal;

    if (signal.entryType === 'SINGLE') {
      const entry = Number(singleEntry);
      if (!Number.isFinite(entry) || entry <= 0) {
        setError('Valid entry is required');
        return;
      }
      updated = { ...signal, direction, singleEntry: entry, stopLoss: sl, takeProfits };
    } else {
      const best = Number(bestEntry);
      const worst = Number(worstEntry);
      if (!Number.isFinite(best) || !Number.isFinite(worst)) {
        setError('Valid best and worst entries are required');
        return;
      }
      updated = { ...signal, direction, bestEntry: best, worstEntry: worst, stopLoss: sl, takeProfits };
    }

    onSave(updated);
  };

  const updateTp = (index: number, price: string) => {
    setTakeProfits((prev) =>
      prev.map((tp, i) => (i === index ? { ...tp, price: Number(price) || 0 } : tp)),
    );
  };

  return (
    <div className="tm-card p-4">
      <h2 className="tm-section-title mb-3">Edit Signal</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(['BUY', 'SELL'] as Direction[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDirection(d)}
              className={cn(
                'rounded-lg border py-2.5 text-sm font-semibold',
                direction === d
                  ? d === 'BUY'
                    ? 'border-profit bg-profit/10 text-profit'
                    : 'border-loss bg-loss/10 text-loss'
                  : 'border-tm-border text-tm-muted',
              )}
            >
              {d}
            </button>
          ))}
        </div>

        {signal.entryType === 'SINGLE' ? (
          <label className="block">
            <span className="tm-label">Entry</span>
            <input className="tm-input mt-1.5" value={singleEntry} onChange={(e) => setSingleEntry(e.target.value)} />
          </label>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="tm-label">Best Entry</span>
              <input className="tm-input mt-1.5" value={bestEntry} onChange={(e) => setBestEntry(e.target.value)} />
            </label>
            <label>
              <span className="tm-label">Worst Entry</span>
              <input className="tm-input mt-1.5" value={worstEntry} onChange={(e) => setWorstEntry(e.target.value)} />
            </label>
          </div>
        )}

        <label className="block">
          <span className="tm-label">Stop Loss</span>
          <input className="tm-input mt-1.5" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
        </label>

        {takeProfits.map((tp, index) => (
          <label key={tp.label} className="block">
            <span className="tm-label">{tp.label}</span>
            <input
              className="tm-input mt-1.5"
              value={tp.price.toString()}
              onChange={(e) => updateTp(index, e.target.value)}
            />
          </label>
        ))}

        {error && <p className="text-sm text-loss">{error}</p>}

        <div className="flex gap-2">
          <button type="button" onClick={handleSave} className="flex-1 rounded-xl bg-profit py-3 text-sm font-semibold text-tm-bg">
            Save Changes
          </button>
          <button type="button" onClick={onCancel} className="rounded-xl border border-tm-border px-4 py-3 text-sm text-tm-muted">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
