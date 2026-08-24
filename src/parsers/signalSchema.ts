import { z } from 'zod';
import type { TradeSignal } from '../types';
import { inferEntryType } from '../calculations/tradeMath';

const takeProfitSchema = z.object({
  label: z.string().min(1),
  price: z.number().positive(),
});

export const tradeSignalSchema = z
  .object({
    symbol: z.literal('XAUUSD'),
    direction: z.enum(['BUY', 'SELL']),
    entryType: z.enum(['ZONE', 'SINGLE']),
    bestEntry: z.number().positive().optional(),
    worstEntry: z.number().positive().optional(),
    singleEntry: z.number().positive().optional(),
    stopLoss: z.number().positive(),
    takeProfits: z.array(takeProfitSchema).min(1),
    source: z.enum(['SCREENSHOT', 'TEXT', 'MANUAL']),
    originalText: z.string().optional(),
    screenshotUrl: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.entryType === 'SINGLE' && data.singleEntry == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Single entry is required for SINGLE entry type',
        path: ['singleEntry'],
      });
    }
    if (data.entryType === 'ZONE' && (data.bestEntry == null || data.worstEntry == null)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Best and worst entries are required for ZONE entry type',
        path: ['bestEntry'],
      });
    }
  });

export function validateTradeSignal(data: unknown): TradeSignal {
  const parsed = tradeSignalSchema.parse(data);
  return {
    ...parsed,
    entryType: inferEntryType(parsed.bestEntry, parsed.worstEntry, parsed.singleEntry),
  };
}

export function safeValidateTradeSignal(
  data: unknown,
): { success: true; data: TradeSignal } | { success: false; error: string } {
  const result = tradeSignalSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues.map((i) => i.message).join(', ') };
  }
  return {
    success: true,
    data: {
      ...result.data,
      entryType: inferEntryType(
        result.data.bestEntry,
        result.data.worstEntry,
        result.data.singleEntry,
      ),
    },
  };
}
