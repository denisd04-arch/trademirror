import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTrade } from '../../contexts/TradeContext';
import { getInitialTradeOverrides } from '../../calculations/calculateTrade';
import { useCalculatedTrade } from '../../hooks/useCalculatedTrade';
import {
  formatCrv,
  formatCurrency,
  formatLot,
  formatPrice,
  formatRiskPercent,
} from '../../utils';
import { CopyButton } from './CopyButton';
import { EditSignalForm } from './EditSignalForm';
import { EntrySelector } from './EntrySelector';
import { TpSelector } from './TpSelector';
import { GuestSettingsBar } from './GuestSettingsBar';
import { cn } from '../../utils';

export function TradeResultView() {
  const { user } = useAuth();
  const {
    signal,
    currentSettings,
    tradeOverrides,
    setTradeOverrides,
    setGuestSettings,
    applySignalWithDefaults,
    resetTrade,
  } = useTrade();
  const calculation = useCalculatedTrade();
  const [editing, setEditing] = useState(false);

  if (!signal || !currentSettings || !tradeOverrides || !calculation) return null;

  const isZone = signal.entryType === 'ZONE';
  const currency = currentSettings.currency;

  return (
    <div className="space-y-3.5 pb-8">
      {!user && (
        <GuestSettingsBar
          settings={currentSettings}
          onChange={(partial) => {
            setGuestSettings(partial);
            setTradeOverrides(
              getInitialTradeOverrides(signal, {
                ...currentSettings,
                ...partial,
                entryMethod: partial.entryMethod ?? currentSettings.entryMethod,
                defaultTp: partial.defaultTp ?? currentSettings.defaultTp,
              }),
            );
          }}
        />
      )}

      {editing && (
        <EditSignalForm
          signal={signal}
          onSave={(updated) => {
            applySignalWithDefaults(updated);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      )}

      {/* ORIGINAL SIGNAL */}
      <section className="tm-card p-3.5">
        <h2 className="tm-section-title">Original Signal</h2>
        {signal.source === 'SCREENSHOT' && signal.screenshotUrl && (
          <img
            src={signal.screenshotUrl}
            alt="Original trading signal screenshot"
            className="mt-3 max-h-72 w-full rounded-[10px] object-contain"
          />
        )}
        {signal.originalText && (
          <pre className="mt-3 overflow-x-auto rounded-[10px] bg-tm-bg p-3 text-xs whitespace-pre-wrap text-tm-text-secondary">
            {signal.originalText}
          </pre>
        )}
        {signal.source === 'MANUAL' && !signal.originalText && (
          <p className="mt-3 text-sm text-tm-text-secondary">
            {signal.direction} · SL {formatPrice(signal.stopLoss)} ·{' '}
            {signal.entryType === 'SINGLE'
              ? `Entry ${formatPrice(signal.singleEntry!)}`
              : `${formatPrice(signal.bestEntry!)} / ${formatPrice(signal.worstEntry!)}`}
          </p>
        )}
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="mt-3 text-xs text-tm-gold"
        >
          {editing ? 'Close editor' : 'Edit Signal'}
        </button>
      </section>

      {/* YOUR TRADE */}
      <section className="tm-card border-tm-gold/50 bg-tm-gold/5 p-3.5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h2 className="tm-section-title">Your Trade</h2>
          <span className="text-xs font-medium text-tm-muted">
            {currentSettings.strategyName ?? 'Guest'}
          </span>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm font-semibold text-tm-text">XAUUSD</span>
          <span
            className={cn(
              'rounded-md px-2 py-0.5 text-[11px] font-bold',
              signal.direction === 'BUY' ? 'bg-tm-green/15 text-tm-green' : 'bg-tm-red/15 text-tm-red',
            )}
          >
            {signal.direction}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MetricCell label="Entry" value={formatPrice(calculation.entry)} copyField="entry" />
          <MetricCell label="Stop Loss" value={formatPrice(calculation.stopLoss)} copyField="sl" />
          <MetricCell label={calculation.selectedTpLabel} value={formatPrice(calculation.takeProfit)} copyField="tp" />
          <MetricCell label="Lot" value={formatLot(calculation.lotSize)} copyField="lot" />
          <MetricCell label="Risk" value={formatCurrency(calculation.actualRisk, currency).replace(/^[+-]/, '')} />
          <MetricCell label="CRV" value={formatCrv(calculation.crv)} />
        </div>

        {calculation.riskExceeded && (
          <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-tm-warning/30 bg-tm-warning/10 p-2.5 text-tm-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-xs">
              Actual risk exceeds your selected risk. Target{' '}
              {formatCurrency(calculation.targetRisk, currency).replace(/^[+-]/, '')} · Actual{' '}
              {formatCurrency(calculation.actualRisk, currency).replace(/^[+-]/, '')}
            </p>
          </div>
        )}
      </section>

      {/* TRADE DETAILS */}
      <section className="tm-card p-3.5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="tm-section-title">Trade Details</h2>
          <button
            type="button"
            onClick={resetTrade}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-tm-border px-2.5 py-1.5 text-xs text-tm-muted"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New Signal
          </button>
        </div>

        {isZone && (
          <div className="mb-4">
            <p className="tm-label mb-2">Entry (change instantly)</p>
            <EntrySelector
              value={tradeOverrides.selectedEntry}
              onChange={(selectedEntry) => setTradeOverrides({ selectedEntry })}
            />
          </div>
        )}

        <div className="mb-4">
          <p className="tm-label mb-2">Take Profit (change instantly)</p>
          <TpSelector
            takeProfits={signal.takeProfits}
            value={tradeOverrides.selectedTpLabel}
            onChange={(selectedTpLabel) => setTradeOverrides({ selectedTpLabel })}
          />
        </div>

        <div className="space-y-2 border-t border-tm-border pt-3 text-sm">
          <DetailRow label="Account" value={currentSettings.strategyName ?? 'Guest'} />
          <DetailRow label="Balance" value={formatCurrency(currentSettings.accountBalance, currency).replace(/^[+-]/, '')} />
          <DetailRow label="Risk" value={formatRiskPercent(currentSettings.riskPercent)} />
          <DetailRow label="Target Risk" value={formatCurrency(calculation.targetRisk, currency).replace(/^[+-]/, '')} />
          <DetailRow label="Actual Risk" value={formatCurrency(calculation.actualRisk, currency).replace(/^[+-]/, '')} />
          <DetailRow label="Actual Risk %" value={formatRiskPercent(calculation.actualRiskPercent)} />
          <DetailRow label="Entry" value={formatPrice(calculation.entry)} copyField="entry-detail" copyValue={formatPrice(calculation.entry)} />
          <DetailRow label="Stop Loss" value={formatPrice(calculation.stopLoss)} copyField="sl-detail" copyValue={formatPrice(calculation.stopLoss)} />
          <DetailRow label="Potential Loss" value={formatCurrency(-calculation.potentialLoss, currency)} valueClass="text-tm-red" />
          <DetailRow label="Lot Size" value={formatLot(calculation.lotSize)} copyField="lot-detail" copyValue={formatLot(calculation.lotSize)} />
          <DetailRow label="Selected TP" value={formatPrice(calculation.takeProfit)} copyField="tp-detail" copyValue={formatPrice(calculation.takeProfit)} />
          <DetailRow label="Potential Profit" value={formatCurrency(calculation.potentialProfit, currency)} valueClass="text-tm-green" />
          <DetailRow label="CRV" value={formatCrv(calculation.crv)} />
        </div>
      </section>

      {/* ALL TAKE PROFITS */}
      <section className="tm-card p-3.5">
        <h2 className="tm-section-title mb-3">All Take Profits</h2>
        <div className="space-y-2">
          {calculation.allTakeProfits.map((tp) => {
            const selected = tp.label.toUpperCase() === calculation.selectedTpLabel.toUpperCase();
            return (
              <div
                key={tp.label}
                className={cn(
                  'flex items-center justify-between rounded-[10px] border px-3 py-2.5',
                  selected ? 'border-tm-gold/50 bg-tm-gold/10' : 'border-tm-border bg-tm-bg/60',
                )}
              >
                <div>
                  <p className="text-sm font-semibold text-tm-text">{tp.label}</p>
                  <p className="text-sm text-tm-text-secondary">{formatPrice(tp.price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-tm-green">{formatCurrency(tp.profit, currency)}</p>
                  <p className="text-[11px] text-tm-muted">CRV {formatCrv(tp.crv)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {!user && (
        <section className="tm-card border-tm-gold/30 p-3.5">
          <h3 className="text-sm font-bold text-tm-text">Save Your Trading Setups</h3>
          <p className="mt-1.5 text-xs text-tm-muted">
            Create a free TradeMirror account to save accounts, risk settings, and strategies.
          </p>
          <div className="mt-3 flex gap-2">
            <Link to="/register" className="tm-btn-primary flex-1 justify-center text-sm">
              Create Free Account
            </Link>
            <Link to="/login" className="tm-btn-secondary flex-1 text-center text-sm">
              Log In
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCell({
  label,
  value,
  copyField,
}: {
  label: string;
  value: string;
  copyField?: string;
}) {
  return (
    <div className="rounded-[10px] border border-tm-border bg-tm-bg/50 p-2.5">
      <p className="text-[10px] font-semibold tracking-wide text-tm-muted uppercase">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-1">
        <p className="text-sm font-semibold text-tm-text">{value}</p>
        {copyField && <CopyButton field={copyField} value={value} />}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueClass,
  copyField,
  copyValue,
}: {
  label: string;
  value: string;
  valueClass?: string;
  copyField?: string;
  copyValue?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-tm-muted">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={cn('font-medium', valueClass ?? 'text-tm-text')}>{value}</span>
        {copyField && copyValue && <CopyButton field={copyField} value={copyValue} />}
      </div>
    </div>
  );
}
