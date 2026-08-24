import { describe, expect, it } from 'vitest';
import { parseTextSignal } from '../parsers/textParser';

describe('textParser', () => {
  it('parses standard telegram format', () => {
    const text = `XAUUSD BUY NOW
ENTRY: 4585 / 4582
SL: 4577
TP1: 4590
TP2: 4595
TP3: 4600`;

    const result = parseTextSignal(text);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.signal.direction).toBe('BUY');
      expect(result.signal.stopLoss).toBe(4577);
      expect(result.signal.takeProfits).toHaveLength(3);
    }
  });

  it('parses LONG as BUY', () => {
    const result = parseTextSignal('XAUUSD LONG\n4582 / 4585\nSL 4577\nTARGET 4590');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.signal.direction).toBe('BUY');
    }
  });

  it('parses GOLD alias', () => {
    const result = parseTextSignal('GOLD SELL\n4585-4582\nSTOP LOSS 4590\nTP 4580');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.signal.direction).toBe('SELL');
    }
  });

  it('returns errors for incomplete signal', () => {
    const result = parseTextSignal('BUY XAUUSD');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});
