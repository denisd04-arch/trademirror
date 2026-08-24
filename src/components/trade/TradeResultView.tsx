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
import { Button } from '../ui/Button';
import { Card, CardTitle } from '../ui/Card';

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
    <div className="space-y-6">
      <AccountSwitcher
        strategies={strategies}
        activeStrategyId={activeStrategyId}
        guestSettings={currentSettings}
        isGuest={!user}
        onSelectStrategy={selectStrategy}
        onGuestChange={(partial) => {
          setGuestSettings(partial);
          if (signal) {
            const nextSettings = {
              ...currentSettings,
              ...partial,
            };
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" onClick={resetTrade}>
          New Signal
        </Button>
        <Button variant="ghost" onClick={() => setEditing((v) => !v)}>
          {editing ? 'Close Editor' : 'Edit Signal'}
        </Button>
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

      <Card>
        <CardTitle>Original Signal</CardTitle>
        {signal.source === 'SCREENSHOT' && signal.screenshotUrl && (
          <img
            src={signal.screenshotUrl}
            alt="Original trading signal screenshot"
            className="max-h-80 w-full rounded-xl object-contain"
          />
        )}
        {signal.originalText && (
          <pre className="overflow-x-auto rounded-xl bg-surface-800 p-4 text-sm whitespace-pre-wrap text-gray-300">
            {signal.originalText}
          </pre>
        )}
        {signal.source === 'MANUAL' && !signal.originalText && (
          <div className="text-sm text-gray-300">
            {signal.direction} · SL {formatPrice(signal.stopLoss)} ·{' '}
            {signal.entryType === 'SINGLE'
              ? `Entry ${formatPrice(signal.singleEntry!)}`
              : `${formatPrice(signal.bestEntry!)} / ${formatPrice(signal.worstEntry!)}`}
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Your Trade</CardTitle>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-surface-800 px-3 py-1 text-sm text-gray-300">
            {currentSettings.strategyName ?? 'Guest'}
          </span>
          <span
            className={`rounded-lg px-3 py-1 text-sm font-bold ${
              signal.direction === 'BUY' ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss'
            }`}
          >
            XAUUSD {signal.direction}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TradeMetric label="Entry" value={formatPrice(calculation.entry)} copyField="entry" copyValue={formatPrice(calculation.entry)} />
          <TradeMetric label="Stop Loss" value={formatPrice(calculation.stopLoss)} copyField="sl" copyValue={formatPrice(calculation.stopLoss)} />
          <TradeMetric label="Take Profit" value={formatPrice(calculation.takeProfit)} copyField="tp" copyValue={formatPrice(calculation.takeProfit)} />
          <TradeMetric label="Lot" value={formatLot(calculation.lotSize)} copyField="lot" copyValue={formatLot(calculation.lotSize)} />
          <TradeMetric label="Risk" value={formatCurrency(calculation.actualRisk, currency)} />
          <TradeMetric label="CRV" value={formatCrv(calculation.crv)} />
        </div>

        {calculation.riskExceeded && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-200">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Actual risk exceeds your selected risk</p>
              <p className="mt-1 text-sm">
                Target: {formatCurrency(calculation.targetRisk, currency)} · Actual:{' '}
                {formatCurrency(calculation.actualRisk, currency)} ·{' '}
                {formatRiskPercent(calculation.actualRiskPercent)}
              </p>
            </div>
          </div>
        )}
      </Card>

      {isZone && (
        <Card>
          <CardTitle>Entry Selector</CardTitle>
          <EntrySelector
            value={tradeOverrides.selectedEntry}
            onChange={(selectedEntry) => setTradeOverrides({ selectedEntry })}
          />
        </Card>
      )}

      <Card>
        <CardTitle>TP Selector</CardTitle>
        <TpSelector
          takeProfits={signal.takeProfits}
          value={tradeOverrides.selectedTpLabel}
          onChange={(selectedTpLabel) => setTradeOverrides({ selectedTpLabel })}
        />
      </Card>

      <Card>
        <CardTitle>Trade Details</CardTitle>
        <dl className="grid gap-3 sm:grid-cols-2">
          <Detail label="Account" value={currentSettings.strategyName ?? 'Guest'} />
          <Detail label="Balance" value={formatCurrency(currentSettings.accountBalance, currency).replace(/^[+-]/, '')} />
          <Detail label="Risk" value={formatRiskPercent(currentSettings.riskPercent)} />
          <Detail label="Target Risk" value={formatCurrency(calculation.targetRisk, currency)} />
          <Detail label="Actual Risk" value={formatCurrency(calculation.actualRisk, currency)} />
          <Detail label="Actual Risk %" value={formatRiskPercent(calculation.actualRiskPercent)} />
          <Detail label="Entry" value={formatPrice(calculation.entry)} />
          <Detail label="Stop Loss" value={formatPrice(calculation.stopLoss)} />
          <Detail label="Potential Loss" value={formatCurrency(-calculation.potentialLoss, currency)} />
          <Detail label="Lot Size" value={formatLot(calculation.lotSize)} />
          <Detail label="Selected TP" value={calculation.selectedTpLabel} />
          <Detail label="Potential Profit" value={formatCurrency(calculation.potentialProfit, currency)} positive />
          <Detail label="CRV" value={formatCrv(calculation.crv)} />
        </dl>
      </Card>

      <Card>
        <CardTitle>All Take Profits</CardTitle>
        <div className="space-y-3">
          {calculation.allTakeProfits.map((tp) => (
            <div
              key={tp.label}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-surface-700 bg-surface-800/60 px-4 py-3"
            >
              <div>
                <p className="font-semibold text-white">{tp.label}</p>
                <p className="text-sm text-gray-400">{formatPrice(tp.price)}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-profit">
                  {formatCurrency(tp.profit, currency)}
                </p>
                <p className="text-sm text-gray-400">CRV {formatCrv(tp.crv)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {!user && (
        <Card className="border-accent-gold/30 bg-gradient-to-br from-surface-900 to-surface-800">
          <h3 className="text-lg font-bold text-white">Save Your Trading Setups</h3>
          <p className="mt-2 text-gray-300">
            Create a free TradeMirror account to save accounts, risk settings, entry preferences,
            default TP, and multiple strategies.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/register">
              <Button>Create Free Account</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary">Log In</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

function TradeMetric({
  label,
  value,
  copyField,
  copyValue,
}: {
  label: string;
  value: string;
  copyField?: string;
  copyValue?: string;
}) {
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-800/50 p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-lg font-semibold text-white">{value}</p>
        {copyField && copyValue && <CopyButton field={copyField} value={copyValue} />}
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className={`mt-1 font-medium ${positive ? 'text-profit' : 'text-white'}`}>
        {value}
      </dd>
    </div>
  );
}
