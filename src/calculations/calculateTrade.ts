import type {
  CalculatedTrade,
  Direction,
  EntryMethod,
  TradeCalculation,
  TradeSettings,
  TradeSignal,
  TpCalculation,
} from '../types';
import {
  calculateCrv,
  calculateLotSize,
  calculateProfit,
  resolveDefaultTp,
  resolveEntryPrice,
} from './tradeMath';

export type CalculateTradeInput = {
  signal: TradeSignal;
  settings: TradeSettings;
  selectedEntry: EntryMethod;
  selectedTpLabel: string;
};

function calculateCore(
  signal: TradeSignal,
  settings: TradeSettings,
  selectedEntry: EntryMethod,
  selectedTpLabel: string,
): TradeCalculation & { selectedTpPrice: number } {
  const entry = resolveEntryPrice(signal, selectedEntry);
  const stopLoss = signal.stopLoss;
  const selectedTp = signal.takeProfits.find(
    (tp) => tp.label.toUpperCase() === selectedTpLabel.toUpperCase(),
  );

  if (!selectedTp) {
    throw new Error(`Take profit ${selectedTpLabel} not found in signal`);
  }

  const lotSize = calculateLotSize(
    settings.accountBalance,
    settings.riskPercent,
    entry,
    stopLoss,
  );

  const targetRisk = settings.accountBalance * (settings.riskPercent / 100);
  const priceDistance = Math.abs(entry - stopLoss);
  const actualRisk = priceDistance * 100 * lotSize;
  const actualRiskPercent = (actualRisk / settings.accountBalance) * 100;
  const potentialLoss = actualRisk;
  const potentialProfit = calculateProfit(signal.direction, entry, selectedTp.price, lotSize);
  const crv = calculateCrv(entry, stopLoss, selectedTp.price);

  return {
    entry,
    stopLoss,
    takeProfit: selectedTp.price,
    lotSize,
    targetRisk,
    actualRisk,
    actualRiskPercent,
    potentialLoss,
    potentialProfit,
    crv,
    riskExceeded: actualRisk > targetRisk,
    selectedTpPrice: selectedTp.price,
  };
}

export function calculateTrade(input: CalculateTradeInput): CalculatedTrade {
  const { signal, settings, selectedEntry, selectedTpLabel } = input;
  const core = calculateCore(signal, settings, selectedEntry, selectedTpLabel);

  const allTakeProfits: TpCalculation[] = signal.takeProfits.map((tp) => ({
    label: tp.label,
    price: tp.price,
    profit: calculateProfit(signal.direction, core.entry, tp.price, core.lotSize),
    crv: calculateCrv(core.entry, core.stopLoss, tp.price),
  }));

  return {
    entry: core.entry,
    stopLoss: core.stopLoss,
    takeProfit: core.takeProfit,
    lotSize: core.lotSize,
    targetRisk: core.targetRisk,
    actualRisk: core.actualRisk,
    actualRiskPercent: core.actualRiskPercent,
    potentialLoss: core.potentialLoss,
    potentialProfit: core.potentialProfit,
    crv: core.crv,
    riskExceeded: core.riskExceeded,
    allTakeProfits,
    selectedTpLabel,
    selectedEntry,
  };
}

export function getInitialTradeOverrides(
  signal: TradeSignal,
  settings: TradeSettings,
): { selectedEntry: EntryMethod; selectedTpLabel: string } {
  const selectedEntry =
    signal.entryType === 'SINGLE' ? settings.entryMethod : settings.entryMethod;

  const defaultTp =
    resolveDefaultTp(signal.takeProfits, settings.defaultTp) ??
    signal.takeProfits[0]?.label ??
    'TP1';

  return {
    selectedEntry: signal.entryType === 'SINGLE' ? 'BEST' : selectedEntry,
    selectedTpLabel: defaultTp,
  };
}

export function buildFutureTradePayload(
  signal: TradeSignal,
  calculation: CalculatedTrade,
  strategyId?: string,
) {
  return {
    tradeId: crypto.randomUUID(),
    symbol: 'XAUUSD' as const,
    direction: signal.direction as Direction,
    entry: calculation.entry,
    stopLoss: calculation.stopLoss,
    takeProfit: calculation.takeProfit,
    volume: calculation.lotSize,
    strategyId,
  };
}
