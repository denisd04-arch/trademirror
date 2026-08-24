import type { Profile } from '../types';
import { supabase } from '../lib/supabase';

function mapProfile(row: {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  account_status: string;
  active_strategy_id: string | null;
}): Profile {
  return row;
}

export const profileService = {
  async get(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data ? mapProfile(data) : null;
  },

  async updateNames(userId: string, firstName: string, lastName: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ first_name: firstName, last_name: lastName })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return mapProfile(data);
  },

  async updateLastLogin(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
  },
};
