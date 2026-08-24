import type { Direction, TakeProfit, TradeSignal } from '../types/index.js';

export type RawAiSignal = {
  symbol?: string | null;
  direction?: string | null;
  entryType?: string | null;
  bestEntry?: number | null;
  worstEntry?: number | null;
  singleEntry?: number | null;
  stopLoss?: number | null;
  takeProfits?: Array<{ label?: string | null; price?: number | null }> | null;
};

function toNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const num = typeof value === 'number' ? value : Number.parseFloat(String(value).replace(/,/g, ''));
  return Number.isFinite(num) && num > 0 ? num : undefined;
}

function normalizeDirection(raw: unknown): Direction | undefined {
  if (typeof raw !== 'string') return undefined;
  const upper = raw.trim().toUpperCase();
  if (upper.includes('BUY') || upper.includes('LONG')) return 'BUY';
  if (upper.includes('SELL') || upper.includes('SHORT')) return 'SELL';
  return undefined;
}

function normalizeTakeProfits(raw: RawAiSignal['takeProfits']): TakeProfit[] {
  if (!Array.isArray(raw)) return [];

  const results: TakeProfit[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    const price = toNumber(item?.price);
    if (price == null) continue;

    let label = (item?.label ?? '').toString().trim().toUpperCase();
    if (!label) label = `TP${results.length + 1}`;
    if (!label.startsWith('TP')) label = `TP${label.replace(/\D/g, '') || results.length + 1}`;
    if (seen.has(label)) continue;

    seen.add(label);
    results.push({ label, price });
  }

  return results.sort((a, b) => {
    const aNum = Number.parseInt(a.label.replace(/\D/g, '') || '0', 10);
    const bNum = Number.parseInt(b.label.replace(/\D/g, '') || '0', 10);
    return aNum - bNum;
  });
}

function orderEntryZone(
  direction: Direction,
  entryA?: number,
  entryB?: number,
): { bestEntry: number; worstEntry: number } | undefined {
  if (entryA == null || entryB == null) return undefined;

  const lower = Math.min(entryA, entryB);
  const higher = Math.max(entryA, entryB);

  if (direction === 'BUY') {
    return { bestEntry: lower, worstEntry: higher };
  }
  return { bestEntry: higher, worstEntry: lower };
}

export type NormalizeResult =
  | { success: true; signal: Omit<TradeSignal, 'source' | 'originalText' | 'screenshotUrl' | 'screenshotFile'> }
  | { success: false; errors: string[] };

export function normalizeAiResponse(raw: RawAiSignal): NormalizeResult {
  const errors: string[] = [];

  const direction = normalizeDirection(raw.direction);
  if (!direction) errors.push('Could not detect direction');

  const stopLoss = toNumber(raw.stopLoss);
  if (stopLoss == null) errors.push('Could not detect stop loss');

  const takeProfits = normalizeTakeProfits(raw.takeProfits);
  if (takeProfits.length === 0) errors.push('Could not detect take profit levels');

  const singleEntry = toNumber(raw.singleEntry);
  const bestRaw = toNumber(raw.bestEntry);
  const worstRaw = toNumber(raw.worstEntry);

  let entryType: 'ZONE' | 'SINGLE';
  let bestEntry: number | undefined;
  let worstEntry: number | undefined;
  let resolvedSingle: number | undefined;

  if (singleEntry != null && bestRaw == null && worstRaw == null) {
    entryType = 'SINGLE';
    resolvedSingle = singleEntry;
  } else if (bestRaw != null && worstRaw != null && direction) {
    entryType = 'ZONE';
    const ordered = orderEntryZone(direction, bestRaw, worstRaw);
    bestEntry = ordered?.bestEntry;
    worstEntry = ordered?.worstEntry;
  } else if (bestRaw != null && worstRaw == null) {
    entryType = 'SINGLE';
    resolvedSingle = bestRaw;
  } else if (worstRaw != null && bestRaw == null) {
    entryType = 'SINGLE';
    resolvedSingle = worstRaw;
  } else {
    errors.push('Could not detect entry');
    entryType = 'SINGLE';
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    signal: {
      symbol: 'XAUUSD',
      direction: direction!,
      entryType,
      bestEntry: entryType === 'ZONE' ? bestEntry : undefined,
      worstEntry: entryType === 'ZONE' ? worstEntry : undefined,
      singleEntry: entryType === 'SINGLE' ? resolvedSingle : undefined,
      stopLoss: stopLoss!,
      takeProfits,
    },
  };
}

/** Representative Telegram signal structure for tests */
export const SAMPLE_AI_RESPONSE: RawAiSignal = {
  symbol: 'XAUUSD',
  direction: 'BUY',
  entryType: 'ZONE',
  bestEntry: 4585,
  worstEntry: 4582,
  stopLoss: 4577,
  takeProfits: [
    { label: 'TP1', price: 4590 },
    { label: 'TP2', price: 4595 },
    { label: 'TP3', price: 4600 },
  ],
};
