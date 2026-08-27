import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { Database } from '../types/database.types';

export type WithdrawalRequestRow = Database['public']['Tables']['withdrawal_requests']['Row'];

export const withdrawalService = {
  // Submit Customer Withdrawal Request via Atomic RPC
  async submitWithdrawalRequest(params: {
    customerId: string;
    amount: number;
    paymentMethod: string;
    accountNumber: string;
    reference: string;
    note?: string;
  }): Promise<{ data: any; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { 
        data: { 
          success: true, 
          request_code: 'WTH-' + Math.floor(10000 + Math.random() * 90000), 
          status: 'processing' 
        }, 
        error: null 
      };
    }

    try {
      const { data, error } = await (supabase.rpc as any)('submit_withdrawal_request', {
        p_customer_id: params.customerId,
        p_amount: params.amount,
        p_payment_method: params.paymentMethod,
        p_account_number: params.accountNumber,
        p_reference: params.reference,
        p_note: params.note || ''
      });

      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Withdrawal submission failed.' };
    }
  },

  // Process / Finalize Withdrawal (Admin RPC)
  async processWithdrawalRequest(requestId: string, status: string, adminNote?: string): Promise<{ data: any; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: { success: true, status }, error: null };
    }

    try {
      const { data, error } = await (supabase.rpc as any)('process_withdrawal_request', {
        p_request_id: requestId,
        p_status: status,
        p_admin_note: adminNote || 'Processed via FedWire payout rail'
      });

      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Withdrawal update failed.' };
    }
  },

  // Fetch Withdrawal Requests
  async getWithdrawalRequests(limit: number = 20): Promise<{ data: WithdrawalRequestRow[]; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return { data: [], error: error.message };
      return { data: (data as any) || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message || 'Failed to fetch withdrawal requests.' };
    }
  }
};
