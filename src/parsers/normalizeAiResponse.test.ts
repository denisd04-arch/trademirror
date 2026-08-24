import { describe, expect, it } from 'vitest';
import { normalizeAiResponse, SAMPLE_AI_RESPONSE } from './normalizeAiResponse';

describe('normalizeAiResponse', () => {
  it('normalizes representative Telegram BUY zone signal', () => {
    const result = normalizeAiResponse(SAMPLE_AI_RESPONSE);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.signal.symbol).toBe('XAUUSD');
    expect(result.signal.direction).toBe('BUY');
    expect(result.signal.entryType).toBe('ZONE');
    expect(result.signal.bestEntry).toBe(4582);
    expect(result.signal.worstEntry).toBe(4585);
    expect(result.signal.stopLoss).toBe(4577);
    expect(result.signal.takeProfits).toEqual([
      { label: 'TP1', price: 4590 },
      { label: 'TP2', price: 4595 },
      { label: 'TP3', price: 4600 },
    ]);
  });

  it('maps LONG to BUY and orders entry zone correctly', () => {
    const result = normalizeAiResponse({
      direction: 'LONG',
      bestEntry: 4585,
      worstEntry: 4582,
      stopLoss: 4577,
      takeProfits: [{ label: 'TP1', price: 4590 }],
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.signal.direction).toBe('BUY');
    expect(result.signal.bestEntry).toBe(4582);
    expect(result.signal.worstEntry).toBe(4585);
  });

  it('maps SHORT to SELL and orders entry zone correctly', () => {
    const result = normalizeAiResponse({
      direction: 'SHORT',
      bestEntry: 4582,
      worstEntry: 4585,
      stopLoss: 4590,
      takeProfits: [{ label: 'TP1', price: 4575 }],
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.signal.direction).toBe('SELL');
    expect(result.signal.bestEntry).toBe(4585);
    expect(result.signal.worstEntry).toBe(4582);
  });

  it('uses single entry when only one value is present', () => {
    const result = normalizeAiResponse({
      direction: 'BUY',
      singleEntry: 4583,
      stopLoss: 4577,
      takeProfits: [{ label: 'TP1', price: 4590 }],
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.signal.entryType).toBe('SINGLE');
    expect(result.signal.singleEntry).toBe(4583);
  });

  it('returns errors for missing required fields', () => {
    const result = normalizeAiResponse({ direction: 'BUY' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('tolerates null optional fields from AI', () => {
    const result = normalizeAiResponse({
      symbol: null,
      direction: 'BUY NOW',
      entryType: null,
      bestEntry: 4585,
      worstEntry: 4582,
      singleEntry: null,
      stopLoss: 4577,
      takeProfits: [
        { label: 'TP1', price: 4590 },
        { label: 'TP2', price: 4595 },
        { label: 'TP3', price: 4600 },
      ],
    });
    expect(result.success).toBe(true);
  });
});
