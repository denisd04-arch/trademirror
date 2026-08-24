import { z } from 'zod';
import type { Currency, EntryMethod, Strategy, StrategyFormData } from '../types';
import { supabase } from '../lib/supabase';

const defaultTpSchema = z.enum(['TP1', 'TP2', 'TP3', 'TP4']);

export const strategyFormSchema = z.object({
  strategy_name: z.string().trim().min(1, 'Strategy name is required'),
  account_balance: z.number().positive('Balance must be greater than 0'),
  currency: z.enum(['USD', 'EUR']),
  risk_percent: z.number().positive('Risk must be greater than 0'),
  entry_method: z.enum(['BEST', 'MIDDLE', 'WORST']),
  default_tp: defaultTpSchema,
});

function mapStrategy(row: {
  id: string;
  user_id: string;
  strategy_name: string;
  account_balance: number;
  currency: string;
  risk_percent: number;
  entry_method: string;
  default_tp: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}): Strategy {
  return {
    id: row.id,
    user_id: row.user_id,
    strategy_name: row.strategy_name,
    account_balance: Number(row.account_balance),
    currency: row.currency as Currency,
    risk_percent: Number(row.risk_percent),
    entry_method: row.entry_method as EntryMethod,
    default_tp: row.default_tp,
    is_active: row.is_active ?? false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const strategyService = {
  async list(userId: string): Promise<Strategy[]> {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(mapStrategy);
  },

  async getActiveStrategy(userId: string): Promise<Strategy | null> {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data ? mapStrategy(data) : null;
  },

  async create(userId: string, form: StrategyFormData): Promise<Strategy> {
    const validated = strategyFormSchema.parse(form);
    const { data, error } = await supabase
      .from('strategies')
      .insert({ ...validated, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return mapStrategy(data);
  },

  async update(strategyId: string, form: StrategyFormData): Promise<Strategy> {
    const validated = strategyFormSchema.parse(form);
    const { data, error } = await supabase
      .from('strategies')
      .update(validated)
      .eq('id', strategyId)
      .select()
      .single();

    if (error) throw error;
    return mapStrategy(data);
  },

  async remove(strategyId: string): Promise<void> {
    const { error } = await supabase.from('strategies').delete().eq('id', strategyId);
    if (error) throw error;
  },

  async setActive(strategyId: string): Promise<void> {
    const { error } = await supabase.rpc('set_active_strategy', {
      p_strategy_id: strategyId,
    });
    if (error) throw error;
  },
};
