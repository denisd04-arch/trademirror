import type { Direction, EntryMethod, EntryType, TakeProfit, TradeSignal } from '../types';

const CONTRACT_SIZE = 100;
const MIN_LOT = 0.01;

export function getBestEntry(signal: TradeSignal): number | undefined {
  if (signal.entryType === 'SINGLE') return signal.singleEntry;
  if (signal.bestEntry == null || signal.worstEntry == null) return undefined;
  return signal.direction === 'BUY'
    ? Math.min(signal.bestEntry, signal.worstEntry)
    : Math.max(signal.bestEntry, signal.worstEntry);
}

export function getWorstEntry(signal: TradeSignal): number | undefined {
  if (signal.entryType === 'SINGLE') return signal.singleEntry;
  if (signal.bestEntry == null || signal.worstEntry == null) return undefined;
  return signal.direction === 'BUY'
    ? Math.max(signal.bestEntry, signal.worstEntry)
    : Math.min(signal.bestEntry, signal.worstEntry);
}

export function getMiddleEntry(signal: TradeSignal): number | undefined {
  const best = getBestEntry(signal);
  const worst = getWorstEntry(signal);
  if (best == null || worst == null) return undefined;
  return (best + worst) / 2;
}

export function resolveEntryPrice(signal: TradeSignal, method: EntryMethod): number {
  if (signal.entryType === 'SINGLE') {
    if (signal.singleEntry == null) throw new Error('Single entry is required');
    return signal.singleEntry;
  }

  switch (method) {
    case 'BEST': {
      const value = getBestEntry(signal);
      if (value == null) throw new Error('Best entry is required');
      return value;
    }
    case 'WORST': {
      const value = getWorstEntry(signal);
      if (value == null) throw new Error('Worst entry is required');
      return value;
    }
    case 'MIDDLE': {
      const value = getMiddleEntry(signal);
      if (value == null) throw new Error('Middle entry is required');
      return value;
    }
    default:
      throw new Error(`Unknown entry method: ${method}`);
  }
}

export function roundLotUp(rawLot: number): number {
  return Math.max(MIN_LOT, Math.ceil(rawLot * 100) / 100);
}

export function calculateLotSize(
  accountBalance: number,
  riskPercent: number,
  entry: number,
  stopLoss: number,
): number {
  const riskAmount = accountBalance * (riskPercent / 100);
  const priceDistance = Math.abs(entry - stopLoss);
  if (priceDistance === 0) return MIN_LOT;
  const riskPerLot = priceDistance * CONTRACT_SIZE;
  const rawLot = riskAmount / riskPerLot;
  return roundLotUp(rawLot);
}

export function calculateProfit(
  direction: Direction,
  entry: number,
  tp: number,
  lotSize: number,
): number {
  const distance = direction === 'BUY' ? tp - entry : entry - tp;
  return distance * CONTRACT_SIZE * lotSize;
}

export function calculateCrv(entry: number, stopLoss: number, tp: number): number {
  const riskDistance = Math.abs(entry - stopLoss);
  if (riskDistance === 0) return 0;
  const rewardDistance = Math.abs(tp - entry);
  return rewardDistance / riskDistance;
}

export function findTakeProfit(takeProfits: TakeProfit[], label: string): TakeProfit | undefined {
  return takeProfits.find((tp) => tp.label.toUpperCase() === label.toUpperCase());
}

export function resolveDefaultTp(
  takeProfits: TakeProfit[],
  preferredLabel: string,
): string | undefined {
  if (takeProfits.length === 0) return undefined;
  const exact = findTakeProfit(takeProfits, preferredLabel);
  if (exact) return exact.label;
  return takeProfits[0]?.label;
}

export function normalizeSignalEntries(signal: TradeSignal): TradeSignal {
  if (signal.entryType === 'SINGLE') return signal;

  const best = getBestEntry(signal);
  const worst = getWorstEntry(signal);
  if (best == null || worst == null) return signal;

  return {
    ...signal,
    bestEntry: best,
    worstEntry: worst,
  };
}

export function inferEntryType(
  bestEntry?: number,
  worstEntry?: number,
  singleEntry?: number,
): EntryType {
  if (singleEntry != null && bestEntry == null && worstEntry == null) return 'SINGLE';
  return 'ZONE';
}

export { CONTRACT_SIZE, MIN_LOT };
