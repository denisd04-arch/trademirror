import type { Profile } from '../types';
import { supabase } from '../lib/supabase';

function mapProfile(row: {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  email_verified?: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  account_status: string;
  active_strategy_id: string | null;
}): Profile {
  return {
    ...row,
    email_verified: row.email_verified ?? false,
    account_status: row.account_status === 'disabled' ? 'disabled' : 'active',
  };
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
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst || !trimmedLast) {
      throw new Error('First name and last name are required');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ first_name: trimmedFirst, last_name: trimmedLast })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return mapProfile(data);
  },

  async updateLastLogin(): Promise<void> {
    const { error } = await supabase.rpc('touch_last_login');
    if (error) throw error;
  },

  isAccountActive(profile: Profile | null): boolean {
    return profile?.account_status !== 'disabled';
  },
};
