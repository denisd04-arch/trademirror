import type { Direction, TakeProfit, TradeSignal } from '../types';
import { inferEntryType } from '../calculations/tradeMath';
import { safeValidateTradeSignal } from './signalSchema';

function parseNumber(value: string): number | undefined {
  const cleaned = value.replace(/,/g, '').trim();
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) ? num : undefined;
}

function normalizeDirection(raw: string): Direction | undefined {
  const upper = raw.toUpperCase();
  if (upper.includes('BUY') || upper.includes('LONG')) return 'BUY';
  if (upper.includes('SELL') || upper.includes('SHORT')) return 'SELL';
  return undefined;
}

function extractDirection(text: string): Direction | undefined {
  const patterns = [
    /\b(XAUUSD|GOLD)\s+(BUY|SELL|LONG|SHORT)\b/i,
    /\b(BUY|SELL|LONG|SHORT)\s+(XAUUSD|GOLD)\b/i,
    /\b(BUY|SELL|LONG|SHORT)\s+NOW\b/i,
    /\b(BUY|SELL|LONG|SHORT)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const candidate = match[2] ?? match[1] ?? match[0];
      const dir = normalizeDirection(candidate);
      if (dir) return dir;
    }
  }
  return undefined;
}

function extractStopLoss(text: string): number | undefined {
  const patterns = [
    /(?:SL|STOP\s*LOSS|S\/L|STOP)\s*[:\-]?\s*([\d.,]+)/i,
    /(?:SL|STOP\s*LOSS)\s+([\d.,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = parseNumber(match[1]);
      if (value != null) return value;
    }
  }
  return undefined;
}

function extractEntryZone(text: string): { best?: number; worst?: number; single?: number } {
  const entryPatterns = [
    /(?:ENTRY|ENT|BUY\s*ZONE|SELL\s*ZONE|PRICE)\s*[:\-]?\s*([\d.,]+)\s*[\/\-–—]\s*([\d.,]+)/i,
    /(?:ENTRY|ENT)\s*[:\-]?\s*([\d.,]+)\s+([\d.,]+)/i,
    /([\d.,]+)\s*[\/\-–—]\s*([\d.,]+)/,
    /(?:ENTRY|ENT|PRICE)\s*[:\-]?\s*([\d.,]+)/i,
  ];

  for (const pattern of entryPatterns) {
    const match = text.match(pattern);
    if (!match) continue;

    if (match[2]) {
      const a = parseNumber(match[1]);
      const b = parseNumber(match[2]);
      if (a != null && b != null) {
        return { best: a, worst: b };
      }
    }

    if (match[1]) {
      const single = parseNumber(match[1]);
      if (single != null) return { single };
    }
  }

  return {};
}

function extractTakeProfits(text: string): TakeProfit[] {
  const results: TakeProfit[] = [];
  const seen = new Set<string>();

  const addTp = (label: string, priceStr: string) => {
    const price = parseNumber(priceStr);
    const normalizedLabel = label.toUpperCase().startsWith('TP') ? label.toUpperCase() : `TP${label}`;
    if (price == null || price <= 0 || seen.has(normalizedLabel)) return;
    seen.add(normalizedLabel);
    results.push({ label: normalizedLabel, price });
  };

  const tpPattern = /\b(TP\d*)\s*[:\-]?\s*([\d.,]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = tpPattern.exec(text)) !== null) {
    addTp(match[1] || '1', match[2]);
  }

  const targetSimple = /\bTARGET\s+([\d.,]+)/gi;
  while ((match = targetSimple.exec(text)) !== null) {
    addTp('TP1', match[1]);
  }

  const targetNumbered = /\bTARGET\s*(\d+)\s*[:\-]?\s*([\d.,]+)/gi;
  while ((match = targetNumbered.exec(text)) !== null) {
    addTp(`TP${match[1]}`, match[2]);
  }

  const takeProfitPattern = /\bTAKE\s*PROFIT\s*(\d*)\s*[:\-]?\s*([\d.,]+)/gi;
  while ((match = takeProfitPattern.exec(text)) !== null) {
    addTp(match[1] || '1', match[2]);
  }

  return results.sort((a, b) => {
    const aNum = Number.parseInt(a.label.replace(/\D/g, '') || '0', 10);
    const bNum = Number.parseInt(b.label.replace(/\D/g, '') || '0', 10);
    return aNum - bNum;
  });
}

export type ParseTextResult =
  | { success: true; signal: TradeSignal }
  | { success: false; errors: string[] };

export function parseTextSignal(text: string): ParseTextResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { success: false, errors: ['Signal text is empty'] };
  }

  const errors: string[] = [];
  const direction = extractDirection(trimmed);
  if (!direction) errors.push('Could not detect Direction');

  const stopLoss = extractStopLoss(trimmed);
  if (stopLoss == null) errors.push('Could not detect Stop Loss');

  const entry = extractEntryZone(trimmed);
  if (!entry.best && !entry.worst && entry.single == null) {
    errors.push('Could not detect Entry');
  }

  const takeProfits = extractTakeProfits(trimmed);
  if (takeProfits.length === 0) errors.push('Could not detect Take Profit levels');

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const entryType = inferEntryType(entry.best, entry.worst, entry.single);
  const rawSignal = {
    symbol: 'XAUUSD' as const,
    direction: direction!,
    entryType,
    bestEntry: entryType === 'ZONE' ? entry.best : undefined,
    worstEntry: entryType === 'ZONE' ? entry.worst : undefined,
    singleEntry: entryType === 'SINGLE' ? entry.single : undefined,
    stopLoss: stopLoss!,
    takeProfits,
    source: 'TEXT' as const,
    originalText: trimmed,
  };

  const validated = safeValidateTradeSignal(rawSignal);
  if (!validated.success) {
    return { success: false, errors: [validated.error] };
  }

  return { success: true, signal: validated.data };
}
