import { describe, expect, it } from 'vitest';
import { calculateTrade } from '../calculations/calculateTrade';
import {
  calculateCrv,
  calculateLotSize,
  calculateProfit,
  getBestEntry,
  getMiddleEntry,
  getWorstEntry,
  roundLotUp,
} from '../calculations/tradeMath';
import type { TradeSignal, TradeSettings } from '../types';

const baseSignal: TradeSignal = {
  symbol: 'XAUUSD',
  direction: 'BUY',
  entryType: 'ZONE',
  bestEntry: 4582,
  worstEntry: 4585,
  stopLoss: 4577,
  takeProfits: [
    { label: 'TP1', price: 4590 },
    { label: 'TP2', price: 4595 },
    { label: 'TP3', price: 4600 },
  ],
  source: 'MANUAL',
};

const settings: TradeSettings = {
  accountBalance: 1000,
  currency: 'USD',
  riskPercent: 1,
  entryMethod: 'MIDDLE',
  defaultTp: 'TP2',
};

describe('tradeMath', () => {
  it('resolves BUY best/middle/worst entries', () => {
    expect(getBestEntry(baseSignal)).toBe(4582);
    expect(getWorstEntry(baseSignal)).toBe(4585);
    expect(getMiddleEntry(baseSignal)).toBe(4583.5);
  });

  it('resolves SELL best/worst entries direction-aware', () => {
    const sellSignal = { ...baseSignal, direction: 'SELL' as const, bestEntry: 4585, worstEntry: 4582 };
    expect(getBestEntry(sellSignal)).toBe(4585);
    expect(getWorstEntry(sellSignal)).toBe(4582);
  });

  it('rounds lot up to 2 decimals with 0.01 minimum', () => {
    expect(roundLotUp(0.001)).toBe(0.01);
    expect(roundLotUp(0.011)).toBe(0.02);
    expect(roundLotUp(0.15)).toBe(0.15);
  });

  it('never returns 0.00 lots for $150 account at 1% risk', () => {
    const lot = calculateLotSize(150, 1, 4583.5, 4577);
    expect(lot).toBeGreaterThanOrEqual(0.01);
    expect(lot).not.toBe(0);
  });

  it('calculates BUY profit', () => {
    const profit = calculateProfit('BUY', 4583.5, 4590, 0.01);
    expect(profit).toBeCloseTo(6.5, 2);
  });

  it('calculates SELL profit', () => {
    const profit = calculateProfit('SELL', 4585, 4580, 0.1);
    expect(profit).toBeCloseTo(50, 2);
  });

  it('calculates CRV', () => {
    expect(calculateCrv(4583.5, 4577, 4590)).toBeCloseTo(1, 1);
  });
});

describe('calculateTrade', () => {
  it('calculates full trade with middle entry and TP2', () => {
    const result = calculateTrade({
      signal: baseSignal,
      settings,
      selectedEntry: 'MIDDLE',
      selectedTpLabel: 'TP2',
    });

    expect(result.entry).toBe(4583.5);
    expect(result.lotSize).toBeGreaterThanOrEqual(0.01);
    expect(result.takeProfit).toBe(4595);
    expect(result.potentialProfit).toBeGreaterThan(0);
    expect(result.crv).toBeGreaterThan(0);
  });

  it('flags risk exceeded when actual risk > target', () => {
    const result = calculateTrade({
      signal: baseSignal,
      settings: { ...settings, accountBalance: 150, riskPercent: 0.1 },
      selectedEntry: 'WORST',
      selectedTpLabel: 'TP1',
    });

    expect(result.lotSize).toBe(0.01);
    expect(result.riskExceeded).toBe(true);
  });

  it('handles single entry without zone selectors', () => {
    const singleSignal: TradeSignal = {
      ...baseSignal,
      entryType: 'SINGLE',
      singleEntry: 4583,
      bestEntry: undefined,
      worstEntry: undefined,
    };

    const result = calculateTrade({
      signal: singleSignal,
      settings,
      selectedEntry: 'BEST',
      selectedTpLabel: 'TP1',
    });

    expect(result.entry).toBe(4583);
  });

  it('calculates all take profits', () => {
    const result = calculateTrade({
      signal: baseSignal,
      settings,
      selectedEntry: 'BEST',
      selectedTpLabel: 'TP1',
    });

    expect(result.allTakeProfits).toHaveLength(3);
    expect(result.allTakeProfits[0].profit).toBeGreaterThan(0);
  });
});
