import { describe, expect, it } from 'vitest';
import { strategyFormSchema } from '../services/strategyService';

describe('strategyFormSchema', () => {
  it('validates a correct strategy', () => {
    const result = strategyFormSchema.safeParse({
      strategy_name: 'FTMO 100K',
      account_balance: 100000,
      currency: 'USD',
      risk_percent: 0.5,
      entry_method: 'BEST',
      default_tp: 'TP1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid balance', () => {
    const result = strategyFormSchema.safeParse({
      strategy_name: 'Test',
      account_balance: 0,
      currency: 'USD',
      risk_percent: 1,
      entry_method: 'MIDDLE',
      default_tp: 'TP1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid currency', () => {
    const result = strategyFormSchema.safeParse({
      strategy_name: 'Test',
      account_balance: 1000,
      currency: 'GBP',
      risk_percent: 1,
      entry_method: 'MIDDLE',
      default_tp: 'TP1',
    });
    expect(result.success).toBe(false);
  });
});
