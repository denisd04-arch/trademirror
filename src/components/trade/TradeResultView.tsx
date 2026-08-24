import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
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
import { AccountSwitcher } from './AccountSwitcher';
import { CopyButton } from './CopyButton';
import { EditSignalForm } from './EditSignalForm';
import { EntrySelector } from './EntrySelector';
import { TpSelector } from './TpSelector';
import { cn } from '../../utils';

export function TradeResultView() {
  const { user } = useAuth();
  const {
    signal,
    strategies,
    activeStrategyId,
    currentSettings,
    tradeOverrides,
    setTradeOverrides,
    selectStrategy,
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
    <div className="space-y-4 pb-8">
      <AccountSwitcher
        strategies={strategies}
        activeStrategyId={activeStrategyId}
        guestSettings={currentSettings}
        isGuest={!user}
        onSelectStrategy={selectStrategy}
        onGuestChange={(partial) => {
          setGuestSettings(partial);
          if (signal) {
            const nextSettings = { ...currentSettings, ...partial };
            setTradeOverrides(
              getInitialTradeOverrides(signal, {
                ...nextSettings,
                entryMethod: partial.entryMethod ?? nextSettings.entryMethod,
                defaultTp: partial.defaultTp ?? nextSettings.defaultTp,
              }),
            );
          }
        }}
      />

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={resetTrade}
          className="rounded-lg border border-tm-border px-3 py-2 text-sm text-tm-muted transition hover:text-tm-text"
        >
          New Signal
        </button>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="rounded-lg border border-tm-border px-3 py-2 text-sm text-accent-gold"
        >
          {editing ? 'Close' : 'Edit Signal'}
        </button>
      </div>

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
      <section className="tm-card p-4">
        <h2 className="tm-section-title">Original Signal</h2>
        {signal.source === 'SCREENSHOT' && signal.screenshotUrl && (
          <img
            src={signal.screenshotUrl}
            alt="Original trading signal screenshot"
            className="mt-3 max-h-72 w-full rounded-lg object-contain"
          />
        )}
        {signal.originalText && (
          <pre className="mt-3 overflow-x-auto rounded-lg bg-tm-bg p-3 text-xs whitespace-pre-wrap text-tm-text-secondary">
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
      </section>

      {/* YOUR TRADE */}
      <section className="tm-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="tm-section-title">Your Trade</h2>
          <span
            className={cn(
              'rounded-md px-2 py-0.5 text-xs font-bold',
              signal.direction === 'BUY' ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss',
            )}
          >
            XAUUSD {signal.direction}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Metric label="Account" value={currentSettings.strategyName ?? 'Guest'} />
          <Metric label="Risk" value={formatRiskPercent(currentSettings.riskPercent)} />
          <Metric label="Target Risk" value={formatCurrency(calculation.targetRisk, currency).replace(/^[+-]/, '')} />
          <Metric label="Actual Risk" value={formatCurrency(calculation.actualRisk, currency).replace(/^[+-]/, '')} />
          <Metric label="Actual Risk %" value={formatRiskPercent(calculation.actualRiskPercent)} className="col-span-2" />
        </div>

        <div className="my-4 border-t border-tm-border" />

        <div className="space-y-3">
          <CopyRow label="Entry" value={formatPrice(calculation.entry)} copyField="entry" />
          <CopyRow label="Stop Loss" value={formatPrice(calculation.stopLoss)} copyField="sl" />
          <Row label="Potential Loss" value={formatCurrency(-calculation.potentialLoss, currency)} valueClass="text-loss" />
          <CopyRow label="Lot Size" value={formatLot(calculation.lotSize)} copyField="lot" />
          <CopyRow label="Selected TP" value={formatPrice(calculation.takeProfit)} copyField="tp" />
          <Row label="Potential Profit" value={formatCurrency(calculation.potentialProfit, currency)} valueClass="text-profit" />
          <Row label="CRV" value={formatCrv(calculation.crv)} valueClass="text-tm-text" />
        </div>

        {calculation.riskExceeded && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Actual risk exceeds your selected risk</p>
              <p className="mt-1 text-xs opacity-90">
                Target {formatCurrency(calculation.targetRisk, currency).replace(/^[+-]/, '')} · Actual{' '}
                {formatCurrency(calculation.actualRisk, currency).replace(/^[+-]/, '')}
              </p>
            </div>
          </div>
        )}
      </section>

      {isZone && (
        <section className="tm-card p-4">
          <h2 className="tm-section-title mb-3">Entry</h2>
          <EntrySelector
            value={tradeOverrides.selectedEntry}
            onChange={(selectedEntry) => setTradeOverrides({ selectedEntry })}
          />
        </section>
      )}

      <section className="tm-card p-4">
        <h2 className="tm-section-title mb-3">Take Profit</h2>
        <TpSelector
          takeProfits={signal.takeProfits}
          value={tradeOverrides.selectedTpLabel}
          onChange={(selectedTpLabel) => setTradeOverrides({ selectedTpLabel })}
        />
      </section>

      {/* TRADE DETAILS */}
      <section className="tm-card p-4">
        <h2 className="tm-section-title mb-3">Trade Details</h2>
        <dl className="space-y-2.5 text-sm">
          <Detail label="Account" value={currentSettings.strategyName ?? 'Guest'} />
          <Detail label="Balance" value={formatCurrency(currentSettings.accountBalance, currency).replace(/^[+-]/, '')} />
          <Detail label="Risk" value={formatRiskPercent(currentSettings.riskPercent)} />
          <Detail label="Target Risk" value={formatCurrency(calculation.targetRisk, currency).replace(/^[+-]/, '')} />
          <Detail label="Actual Risk" value={formatCurrency(calculation.actualRisk, currency).replace(/^[+-]/, '')} />
          <Detail label="Actual Risk %" value={formatRiskPercent(calculation.actualRiskPercent)} />
          <Detail label="Entry" value={formatPrice(calculation.entry)} />
          <Detail label="Stop Loss" value={formatPrice(calculation.stopLoss)} />
          <Detail label="Potential Loss" value={formatCurrency(-calculation.potentialLoss, currency)} negative />
          <Detail label="Lot Size" value={formatLot(calculation.lotSize)} />
          <Detail label="Selected TP" value={calculation.selectedTpLabel} />
          <Detail label="Potential Profit" value={formatCurrency(calculation.potentialProfit, currency)} positive />
          <Detail label="CRV" value={formatCrv(calculation.crv)} />
        </dl>
      </section>

      {/* ALL TAKE PROFITS */}
      <section className="tm-card p-4">
        <h2 className="tm-section-title mb-3">All Take Profits</h2>
        <div className="space-y-2">
          {calculation.allTakeProfits.map((tp) => {
            const selected = tp.label.toUpperCase() === calculation.selectedTpLabel.toUpperCase();
            return (
              <div
                key={tp.label}
                className={cn(
                  'flex items-center justify-between rounded-lg border px-3 py-3',
                  selected
                    ? 'border-accent-gold/40 bg-accent-gold/10'
                    : 'border-tm-border bg-tm-bg/50',
                )}
              >
                <div>
                  <p className="text-sm font-semibold text-tm-text">{tp.label}</p>
                  <p className="text-sm text-tm-text-secondary">{formatPrice(tp.price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-profit">
                    {formatCurrency(tp.profit, currency)}
                  </p>
                  <p className="text-xs text-tm-muted">CRV {formatCrv(tp.crv)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {!user && (
        <section className="tm-card border-accent-gold/30 p-4">
          <h3 className="text-base font-bold text-tm-text">Save Your Trading Setups</h3>
          <p className="mt-2 text-sm text-tm-muted">
            Create a free TradeMirror account to save accounts, risk settings, entry preferences,
            default TP, and multiple strategies.
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              to="/register"
              className="flex-1 rounded-xl bg-accent-gold py-3 text-center text-sm font-semibold text-tm-bg"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="flex-1 rounded-xl border border-tm-border py-3 text-center text-sm text-tm-text-secondary"
            >
              Log In
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

function Metric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-tm-muted">{label}</p>
      <p className="mt-0.5 font-medium text-tm-text">{value}</p>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-tm-muted">{label}</span>
      <span className={cn('text-sm font-semibold', valueClass ?? 'text-tm-text')}>{value}</span>
    </div>
  );
}

function CopyRow({
  label,
  value,
  copyField,
}: {
  label: string;
  value: string;
  copyField: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-tm-muted">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-tm-text">{value}</span>
        <CopyButton field={copyField} value={value} />
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  positive,
  negative,
}: {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-tm-muted">{label}</dt>
      <dd
        className={cn(
          'font-medium',
          positive && 'text-profit',
          negative && 'text-loss',
          !positive && !negative && 'text-tm-text',
        )}
      >
        {value}
      </dd>
    </div>
  );
}
