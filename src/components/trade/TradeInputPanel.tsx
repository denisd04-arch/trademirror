import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardPaste, ImageUp, Keyboard, Loader2 } from 'lucide-react';
import { useTrade } from '../../contexts/TradeContext';
import { signalParserService } from '../../services/signalParserService';
import type { Direction, TradeSignal } from '../../types';
import { cn } from '../../utils';

type InputMode = 'upload' | 'manual' | 'paste';

export function TradeInputPanel() {
  const navigate = useNavigate();
  const { applySignalWithDefaults } = useTrade();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<InputMode>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [manual, setManual] = useState({
    direction: 'BUY' as Direction,
    bestEntry: '',
    worstEntry: '',
    stopLoss: '',
    tps: ['', '', ''] as string[],
  });

  const goToResult = (signal: TradeSignal) => {
    applySignalWithDefaults(signal);
    navigate('/trade');
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    try {
      const result = await signalParserService.parseScreenshot(selectedFile);
      if (!result.success) {
        setError(result.error);
        return;
      }
      goToResult({
        ...result.signal,
        screenshotUrl: previewUrl ?? result.signal.screenshotUrl,
      });
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
    const takeProfits = manual.tps
      .map((tp, i) => (tp ? { label: `TP${i + 1}`, price: Number(tp) } : null))
      .filter((tp): tp is { label: string; price: number } => Boolean(tp && tp.price > 0));

    if (!manual.stopLoss || !manual.bestEntry || !manual.worstEntry || takeProfits.length === 0) {
      setError('Entry zone, stop loss, and at least one TP are required');
      return;
    }

    goToResult({
      symbol: 'XAUUSD',
      direction: manual.direction,
      entryType: 'ZONE',
      bestEntry: Number(manual.bestEntry),
      worstEntry: Number(manual.worstEntry),
      stopLoss: Number(manual.stopLoss),
      takeProfits,
      source: 'MANUAL',
    });
  };

  const updateTp = (index: number, value: string) => {
    setManual((m) => {
      const tps = [...m.tps];
      tps[index] = value;
      return { ...m, tps };
    });
  };

  const removeTp = (index: number) => {
    setManual((m) => {
      const tps = [...m.tps];
      tps[index] = '';
      return { ...m, tps };
    });
  };

  return (
    <div className="space-y-4">
      {mode === 'upload' && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />

          {!previewUrl ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center gap-4 rounded-2xl border border-accent-gold/30 bg-accent-gold/10 px-5 py-5 text-left transition hover:bg-accent-gold/15"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-gold/20">
                <ImageUp className="h-5 w-5 text-accent-gold" />
              </div>
              <div>
                <p className="text-base font-semibold text-tm-text">Upload Screenshot</p>
                <p className="mt-0.5 text-sm text-tm-muted">Upload a trading signal image</p>
              </div>
            </button>
          ) : (
            <div className="tm-card p-4">
              <p className="tm-section-title">Selected Screenshot</p>
              <img
                src={previewUrl}
                alt="Selected screenshot"
                className="mt-3 max-h-64 w-full rounded-xl object-contain"
              />
              {loading ? (
                <div className="mt-4 flex items-center justify-center gap-2 py-3 text-sm text-tm-text-secondary">
                  <Loader2 className="h-4 w-4 animate-spin text-accent-gold" />
                  Analyzing signal...
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    className="flex-1 rounded-xl bg-profit py-3 text-sm font-semibold text-tm-bg transition hover:bg-profit-dim"
                  >
                    Analyze Signal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="rounded-xl border border-tm-border px-4 py-3 text-sm text-tm-muted"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {mode === 'paste' && (
        <div className="tm-card p-4">
          <p className="text-base font-semibold text-tm-text">Paste Signal</p>
          <p className="mt-1 text-sm text-tm-muted">Paste a Telegram-style signal message</p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`XAUUSD BUY NOW\nENTRY: 4585 / 4582\nSL: 4577\nTP1: 4590\nTP2: 4595`}
            className="tm-input mt-4 min-h-40 resize-none"
          />
          <button
            type="button"
            onClick={handlePaste}
            className="mt-3 w-full rounded-xl bg-profit py-3 text-sm font-semibold text-tm-bg transition hover:bg-profit-dim"
          >
            Parse Signal
          </button>
        </div>
      )}

      {mode === 'manual' && (
        <div className="space-y-4">
          <div>
            <p className="text-xl font-bold text-tm-text">Input Trade</p>
            <p className="mt-1 text-sm text-tm-muted">Enter the minimum details to calculate your lot size.</p>
          </div>

          <div>
            <p className="tm-label">Direction</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(['BUY', 'SELL'] as Direction[]).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => setManual((m) => ({ ...m, direction: dir }))}
                  className={cn(
                    'rounded-xl border py-3 text-sm font-semibold transition',
                    manual.direction === dir
                      ? dir === 'BUY'
                        ? 'border-profit bg-profit/10 text-profit'
                        : 'border-loss bg-loss/10 text-loss'
                      : 'border-tm-border bg-tm-card text-tm-muted',
                  )}
                >
                  {dir} {dir === 'BUY' ? '↑' : '↓'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="tm-label">Entry</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Field label="Entry 1" value={manual.bestEntry} onChange={(v) => setManual((m) => ({ ...m, bestEntry: v }))} />
              <Field label="Entry 2" value={manual.worstEntry} onChange={(v) => setManual((m) => ({ ...m, worstEntry: v }))} />
            </div>
          </div>

          <Field label="Stop Loss" value={manual.stopLoss} onChange={(v) => setManual((m) => ({ ...m, stopLoss: v }))} />

          <div>
            <p className="tm-label">Take Profits</p>
            <div className="mt-2 space-y-2">
              {manual.tps.map((tp, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-10 text-xs font-semibold text-tm-muted">TP{index + 1}</span>
                  <input
                    className="tm-input"
                    value={tp}
                    onChange={(e) => updateTp(index, e.target.value)}
                    placeholder="0.00"
                  />
                  {tp && (
                    <button type="button" onClick={() => removeTp(index)} className="px-2 text-tm-muted">
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleManual}
            className="w-full rounded-xl bg-profit py-3.5 text-sm font-semibold text-tm-bg transition hover:bg-profit-dim"
          >
            Calculate
          </button>
          <p className="text-center text-xs text-tm-muted">Take profits are optional — add them after calculating.</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <ModeTab active={mode === 'upload'} icon={<ImageUp className="h-4 w-4" />} label="Screenshot" onClick={() => setMode('upload')} />
        <ModeTab active={mode === 'paste'} icon={<ClipboardPaste className="h-4 w-4" />} label="Paste" onClick={() => setMode('paste')} />
        <ModeTab active={mode === 'manual'} icon={<Keyboard className="h-4 w-4" />} label="Manual" onClick={() => setMode('manual')} />
      </div>

      {error && (
        <div className="rounded-xl border border-loss/30 bg-loss/10 px-4 py-3 text-sm text-loss">
          {error}
        </div>
      )}
    </div>
  );
}

function ModeTab({
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
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition',
        active
          ? 'border-accent-gold/40 bg-accent-gold/10 text-accent-gold'
          : 'border-tm-border bg-tm-card text-tm-muted hover:border-tm-border-hover',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="text-xs text-tm-muted">{label}</span>
      <input className="tm-input mt-1" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
