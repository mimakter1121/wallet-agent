import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { Database } from '../types/database.types';

export type CommissionTransactionRow = Database['public']['Tables']['commission_transactions']['Row'];

export const commissionService = {
  // Fetch Commission Ledger
  async getCommissionHistory(limit: number = 30): Promise<{ data: CommissionTransactionRow[]; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('commission_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return { data: [], error: error.message };
      return { data: (data as any) || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message || 'Failed to load commission history.' };
    }
  },

  // Claim Commission to Wallet Float via Atomic RPC
  async claimCommission(amount: number): Promise<{ data: any; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: { success: true, claimed_amount: amount }, error: null };
    }

    try {
      const { data, error } = await (supabase.rpc as any)('claim_commission_to_wallet', {
        p_amount: amount
      });

      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to claim commission.' };
    }
  }
};
