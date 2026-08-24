import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageUp, Keyboard, Loader2, Type } from 'lucide-react';
import { useTrade } from '../../contexts/TradeContext';
import { signalParserService } from '../../services/signalParserService';
import type { TradeSignal } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

type InputMode = 'upload' | 'manual' | 'paste';

export function TradeInputPanel() {
  const navigate = useNavigate();
  const { applySignalWithDefaults } = useTrade();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<InputMode>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [manual, setManual] = useState({
    direction: 'BUY' as 'BUY' | 'SELL',
    entryType: 'ZONE' as 'ZONE' | 'SINGLE',
    bestEntry: '',
    worstEntry: '',
    singleEntry: '',
    stopLoss: '',
    tp1: '',
    tp2: '',
    tp3: '',
  });

  const goToResult = (signal: TradeSignal) => {
    applySignalWithDefaults(signal);
    navigate('/trade');
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    setError('');
    try {
      const result = await signalParserService.parseScreenshot(file);
      if (!result.success) {
        setError(result.error);
        return;
      }
      goToResult(result.signal);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = () => {
    setError('');
    const result = signalParserService.parseText(pasteText);
    if (!result.success) {
      setError(result.errors.join(' · '));
      return;
    }
    goToResult(result.signal);
  };

  const handleManual = () => {
    setError('');
    const takeProfits = [
      manual.tp1 && { label: 'TP1', price: Number(manual.tp1) },
      manual.tp2 && { label: 'TP2', price: Number(manual.tp2) },
      manual.tp3 && { label: 'TP3', price: Number(manual.tp3) },
    ].filter((tp): tp is { label: string; price: number } => Boolean(tp && tp.price > 0));

    if (!manual.stopLoss || takeProfits.length === 0) {
      setError('Stop Loss and at least one TP are required');
      return;
    }

    const signal: TradeSignal = {
      symbol: 'XAUUSD',
      direction: manual.direction,
      entryType: manual.entryType,
      bestEntry: manual.entryType === 'ZONE' ? Number(manual.bestEntry) : undefined,
      worstEntry: manual.entryType === 'ZONE' ? Number(manual.worstEntry) : undefined,
      singleEntry: manual.entryType === 'SINGLE' ? Number(manual.singleEntry) : undefined,
      stopLoss: Number(manual.stopLoss),
      takeProfits,
      source: 'MANUAL',
    };

    goToResult(signal);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <ModeButton
          active={mode === 'upload'}
          icon={<ImageUp className="h-5 w-5" />}
          label="Upload Screenshot"
          onClick={() => setMode('upload')}
        />
        <ModeButton
          active={mode === 'manual'}
          icon={<Keyboard className="h-5 w-5" />}
          label="Manual Input"
          onClick={() => setMode('manual')}
        />
        <ModeButton
          active={mode === 'paste'}
          icon={<Type className="h-5 w-5" />}
          label="Paste Signal"
          onClick={() => setMode('paste')}
        />
      </div>

      {mode === 'upload' && (
        <Card className="border-dashed border-accent-gold/30">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            {loading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-accent-gold" />
                <p className="text-lg font-medium text-white">Analyzing signal...</p>
              </>
            ) : (
              <>
                <ImageUp className="h-10 w-10 text-accent-gold" />
                <div>
                  <p className="text-lg font-semibold text-white">Upload Screenshot</p>
                  <p className="mt-1 text-sm text-gray-400">
                    Drop a trading signal screenshot for AI extraction
                  </p>
                </div>
                <Button onClick={() => fileRef.current?.click()} disabled={loading}>
                  Choose Image
                </Button>
              </>
            )}
          </div>
        </Card>
      )}

      {mode === 'paste' && (
        <Card>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`XAUUSD BUY NOW\nENTRY: 4585 / 4582\nSL: 4577\nTP1: 4590\nTP2: 4595`}
            className="min-h-40 w-full rounded-xl border border-surface-600 bg-surface-800 p-4 text-white outline-none focus:border-accent-gold/60"
          />
          <Button className="mt-4" onClick={handlePaste}>
            Parse Signal
          </Button>
        </Card>
      )}

      {mode === 'manual' && (
        <Card className="grid gap-4">
          <Select
            label="Direction"
            value={manual.direction}
            onChange={(e) =>
              setManual((m) => ({ ...m, direction: e.target.value as 'BUY' | 'SELL' }))
            }
          >
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </Select>

          <Select
            label="Entry Type"
            value={manual.entryType}
            onChange={(e) =>
              setManual((m) => ({ ...m, entryType: e.target.value as 'ZONE' | 'SINGLE' }))
            }
          >
            <option value="ZONE">Entry Zone</option>
            <option value="SINGLE">Single Entry</option>
          </Select>

          {manual.entryType === 'ZONE' ? (
            <>
              <Input label="Best Entry" value={manual.bestEntry} onChange={(e) => setManual((m) => ({ ...m, bestEntry: e.target.value }))} />
              <Input label="Worst Entry" value={manual.worstEntry} onChange={(e) => setManual((m) => ({ ...m, worstEntry: e.target.value }))} />
            </>
          ) : (
            <Input label="Entry" value={manual.singleEntry} onChange={(e) => setManual((m) => ({ ...m, singleEntry: e.target.value }))} />
          )}

          <Input label="Stop Loss" value={manual.stopLoss} onChange={(e) => setManual((m) => ({ ...m, stopLoss: e.target.value }))} />
          <Input label="TP1" value={manual.tp1} onChange={(e) => setManual((m) => ({ ...m, tp1: e.target.value }))} />
          <Input label="TP2" value={manual.tp2} onChange={(e) => setManual((m) => ({ ...m, tp2: e.target.value }))} />
          <Input label="TP3" value={manual.tp3} onChange={(e) => setManual((m) => ({ ...m, tp3: e.target.value }))} />
          <Button onClick={handleManual}>Calculate</Button>
        </Card>
      )}

      {error && (
        <div className="rounded-xl border border-loss/30 bg-loss/10 p-4 text-sm text-loss">
          {error}
        </div>
      )}
    </div>
  );
}

function ModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-sm font-semibold transition ${
        active
          ? 'border-accent-gold bg-accent-gold/10 text-accent-gold'
          : 'border-surface-600 bg-surface-900 text-gray-300 hover:border-surface-500'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
