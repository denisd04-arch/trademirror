import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  ClipboardPaste,
  ImageUp,
  Keyboard,
  Loader2,
} from 'lucide-react';
import { useTrade } from '../../contexts/TradeContext';
import { signalParserService } from '../../services/signalParserService';
import type { Direction, TradeSignal } from '../../types';
import { cn } from '../../utils';

type View = 'home' | 'manual' | 'screenshot' | 'paste';

export function TradeInputPanel() {
  const navigate = useNavigate();
  const { applySignalWithDefaults } = useTrade();
  const fileRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<View>('home');
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
    setView('screenshot');
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

    if (!manual.stopLoss || !manual.bestEntry || !manual.worstEntry) {
      setError('Entry zone and stop loss are required');
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

  const goHome = () => {
    setView('home');
    setError('');
  };

  if (view === 'home') {
    return (
      <div className="space-y-3">
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

        <button type="button" onClick={() => setView('manual')} className="tm-btn-primary">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-black/15">
              <Keyboard className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-[15px] font-semibold">Input Trade</p>
              <p className="text-[11px] font-normal opacity-80">Enter direction, entry zone &amp; stop loss</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0" />
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          <SecondaryCard
            icon={<ImageUp className="h-5 w-5" />}
            title="Screenshot"
            subtitle="Upload a signal image"
            onClick={() => {
              if (previewUrl) setView('screenshot');
              else fileRef.current?.click();
            }}
          />
          <SecondaryCard
            icon={<ClipboardPaste className="h-5 w-5" />}
            title="Paste"
            subtitle="Paste a signal message"
            onClick={() => setView('paste')}
          />
        </div>

        {error && <ErrorBox message={error} />}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={goHome}
        className="inline-flex items-center gap-1.5 text-sm text-tm-muted hover:text-tm-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {view === 'screenshot' && (
        <>
          {!previewUrl ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="tm-card flex w-full flex-col items-center gap-3 p-6 text-center"
            >
              <ImageUp className="h-8 w-8 text-tm-muted" />
              <p className="text-sm font-medium text-tm-text">Choose screenshot</p>
            </button>
          ) : (
            <div className="tm-card p-3.5">
              <p className="tm-section-title">Selected Screenshot</p>
              <img
                src={previewUrl}
                alt="Selected screenshot"
                className="mt-3 max-h-64 w-full rounded-[10px] object-contain"
              />
              {loading ? (
                <div className="mt-3 flex items-center justify-center gap-2 py-3 text-sm text-tm-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-tm-gold" />
                  Processing...
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={handleAnalyze} className="tm-btn-primary flex-1 justify-center">
                    Analyze Signal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      fileRef.current?.click();
                    }}
                    className="tm-btn-secondary"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {view === 'paste' && (
        <div className="tm-card p-3.5">
          <p className="text-base font-semibold text-tm-text">Paste Signal</p>
          <p className="mt-1 text-xs text-tm-muted">Paste a Telegram-style signal message</p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`XAUUSD BUY NOW\nENTRY: 4585 / 4582\nSL: 4577\nTP1: 4590\nTP2: 4595`}
            className="tm-input mt-3 min-h-36 resize-none"
          />
          <button type="button" onClick={handlePaste} className="tm-btn-primary mt-3 justify-center">
            Parse Signal
          </button>
        </div>
      )}

      {view === 'manual' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-tm-text">Input Trade</h2>
            <p className="mt-1 text-xs text-tm-muted">Enter the minimum details to calculate your lot size.</p>
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
                    'rounded-[10px] border py-3 text-sm font-semibold',
                    manual.direction === dir
                      ? dir === 'BUY'
                        ? 'border-tm-green bg-tm-green/10 text-tm-green'
                        : 'border-tm-red bg-tm-red/10 text-tm-red'
                      : 'border-tm-border bg-tm-card text-tm-muted',
                  )}
                >
                  {dir} {dir === 'BUY' ? '↑' : '↓'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="tm-label">Entry Zone</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Field label="Best Entry" value={manual.bestEntry} onChange={(v) => setManual((m) => ({ ...m, bestEntry: v }))} />
              <Field label="Worst Entry" value={manual.worstEntry} onChange={(v) => setManual((m) => ({ ...m, worstEntry: v }))} />
            </div>
          </div>

          <Field label="Stop Loss" value={manual.stopLoss} onChange={(v) => setManual((m) => ({ ...m, stopLoss: v }))} />

          <div>
            <p className="tm-label">Take Profits</p>
            <div className="mt-2 space-y-2">
              {manual.tps.map((tp, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-9 text-[11px] font-semibold text-tm-muted">TP{index + 1}</span>
                  <input
                    className="tm-input"
                    value={tp}
                    onChange={(e) =>
                      setManual((m) => {
                        const tps = [...m.tps];
                        tps[index] = e.target.value;
                        return { ...m, tps };
                      })
                    }
                    placeholder="Optional"
                  />
                </div>
              ))}
            </div>
          </div>

          <button type="button" onClick={handleManual} className="tm-btn-primary justify-center">
            Calculate
          </button>
          <p className="text-center text-[11px] text-tm-muted">
            Take profits are optional — add them after calculating.
          </p>
        </div>
      )}

      {error && <ErrorBox message={error} />}
    </div>
  );
}

function SecondaryCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="tm-card p-3.5 text-left transition hover:bg-tm-card-hover">
      <div className="text-tm-muted">{icon}</div>
      <p className="mt-2 text-sm font-medium text-tm-text">{title}</p>
      <p className="mt-0.5 text-[11px] text-tm-muted">{subtitle}</p>
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
      <span className="text-[11px] text-tm-muted">{label}</span>
      <input className="tm-input mt-1" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-[10px] border border-tm-red/30 bg-tm-red/10 px-3 py-2.5 text-sm text-tm-red">
      {message}
    </div>
  );
}
