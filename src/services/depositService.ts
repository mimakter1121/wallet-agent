import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { Database } from '../types/database.types';

export type DepositRequestRow = Database['public']['Tables']['deposit_requests']['Row'];

export const depositService = {
  // Submit Customer Deposit Request via Atomic RPC
  async submitDepositRequest(params: {
    customerId: string;
    amount: number;
    paymentMethod: string;
    reference: string;
    note?: string;
  }): Promise<{ data: any; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { 
        data: { 
          success: true, 
          request_code: 'DEP-' + Math.floor(10000 + Math.random() * 90000), 
          status: 'pending' 
        }, 
        error: null 
      };
    }

    try {
      const { data, error } = await (supabase.rpc as any)('submit_deposit_request', {
        p_customer_id: params.customerId,
        p_amount: params.amount,
        p_payment_method: params.paymentMethod,
        p_reference: params.reference,
        p_note: params.note || ''
      });

      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Deposit submission failed.' };
    }
  },

  // Approve Deposit Request (Admin / Clearance Gateway RPC)
  async approveDepositRequest(requestId: string, adminNote?: string): Promise<{ data: any; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: { success: true, status: 'approved' }, error: null };
    }

    try {
      const { data, error } = await (supabase.rpc as any)('approve_deposit_request', {
        p_request_id: requestId,
        p_admin_note: adminNote || 'Cleared via authorized banking channel'
      });

      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Deposit approval failed.' };
    }
  },

  // Fetch Deposit Requests
  async getDepositRequests(limit: number = 20): Promise<{ data: DepositRequestRow[]; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('deposit_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return { data: [], error: error.message };
      return { data: (data as any) || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message || 'Failed to fetch deposit requests.' };
    }
  }
};
