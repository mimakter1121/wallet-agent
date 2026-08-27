import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { Database } from '../types/database.types';

export type TransactionRow = Database['public']['Tables']['transactions']['Row'];
export type WalletTransactionRow = Database['public']['Tables']['wallet_transactions']['Row'];

export interface GetTransactionsParams {
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const transactionService = {
  // Fetch Transactions with Multi-filter & Server Pagination
  async getTransactions(params: GetTransactionsParams = {}): Promise<{ data: TransactionRow[]; count: number; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: [], count: 0, error: null };
    }

    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (params.type && params.type !== 'all') {
        query = query.eq('type', params.type as any);
      }

      if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status as any);
      }

      if (params.search) {
        query = query.or(`transaction_code.ilike.%${params.search}%,reference.ilike.%${params.search}%`);
      }

      query = query.range(offset, offset + limit - 1);

      const { data, count, error } = await query;
      if (error) return { data: [], count: 0, error: error.message };
      return { data: data || [], count: count || 0, error: null };
    } catch (err: any) {
      return { data: [], count: 0, error: err.message || 'Failed to fetch transactions.' };
    }
  },

  // Fetch Immutable Wallet Ledger
  async getWalletLedger(limit: number = 30): Promise<{ data: WalletTransactionRow[]; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return { data: [], error: error.message };
      return { data: data || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message || 'Failed to load wallet ledger.' };
    }
  }
};
