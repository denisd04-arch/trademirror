export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          email_verified: boolean;
          created_at: string;
          updated_at: string;
          last_login: string | null;
          account_status: string;
          active_strategy_id: string | null;
        };
        Insert: {
          id: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          account_status?: string;
          active_strategy_id?: string | null;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          account_status?: string;
          active_strategy_id?: string | null;
        };
        Relationships: [];
      };
      strategies: {
        Row: {
          id: string;
          user_id: string;
          strategy_name: string;
          account_balance: number;
          currency: string;
          risk_percent: number;
          entry_method: string;
          default_tp: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          strategy_name: string;
          account_balance: number;
          currency: string;
          risk_percent: number;
          entry_method: string;
          default_tp?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          strategy_name?: string;
          account_balance?: number;
          currency?: string;
          risk_percent?: number;
          entry_method?: string;
          default_tp?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      set_active_strategy: {
        Args: { p_strategy_id: string };
        Returns: undefined;
      };
      touch_last_login: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
