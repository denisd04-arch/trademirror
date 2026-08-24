import { useState } from 'react';
import type { Direction, TakeProfit, TradeSignal } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardTitle } from '../ui/Card';

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
      updated = {
        ...signal,
        direction,
        singleEntry: entry,
        stopLoss: sl,
        takeProfits,
      };
    } else {
      const best = Number(bestEntry);
      const worst = Number(worstEntry);
      if (!Number.isFinite(best) || !Number.isFinite(worst)) {
        setError('Valid best and worst entries are required');
        return;
      }
      updated = {
        ...signal,
        direction,
        bestEntry: best,
        worstEntry: worst,
        stopLoss: sl,
        takeProfits,
      };
    }

    onSave(updated);
  };

  const updateTp = (index: number, price: string) => {
    setTakeProfits((prev) =>
      prev.map((tp, i) =>
        i === index ? { ...tp, price: Number(price) || 0 } : tp,
      ),
    );
  };

  return (
    <Card>
      <CardTitle>Edit Signal</CardTitle>
      <div className="grid gap-4">
        <div className="flex gap-2">
          {(['BUY', 'SELL'] as Direction[]).map((d) => (
            <Button
              key={d}
              type="button"
              variant={direction === d ? 'primary' : 'secondary'}
              onClick={() => setDirection(d)}
            >
              {d}
            </Button>
          ))}
        </div>

        {signal.entryType === 'SINGLE' ? (
          <Input label="Entry" value={singleEntry} onChange={(e) => setSingleEntry(e.target.value)} />
        ) : (
          <>
            <Input label="Best Entry" value={bestEntry} onChange={(e) => setBestEntry(e.target.value)} />
            <Input label="Worst Entry" value={worstEntry} onChange={(e) => setWorstEntry(e.target.value)} />
          </>
        )}

        <Input label="Stop Loss" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />

        {takeProfits.map((tp, index) => (
          <Input
            key={tp.label}
            label={tp.label}
            value={tp.price.toString()}
            onChange={(e) => updateTp(index, e.target.value)}
          />
        ))}

        {error && <p className="text-sm text-loss">{error}</p>}

        <div className="flex gap-2">
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}
