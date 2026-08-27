import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { Database } from '../types/database.types';

export type CustomerRow = Database['public']['Tables']['customers']['Row'];

export interface GetCustomersParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const customerService = {
  // Fetch Customer Directory with Search, Status filter, & Pagination
  async getCustomers(params: GetCustomersParams = {}): Promise<{ data: CustomerRow[]; count: number; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: [], count: 0, error: null };
    }

    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status as any);
      }

      if (params.search) {
        query = query.or(`full_name.ilike.%${params.search}%,customer_code.ilike.%${params.search}%,phone.ilike.%${params.search}%`);
      }

      query = query.range(offset, offset + limit - 1);

      const { data, count, error } = await query;
      if (error) return { data: [], count: 0, error: error.message };
      return { data: (data as any) || [], count: count || 0, error: null };
    } catch (err: any) {
      return { data: [], count: 0, error: err.message || 'Error fetching customers.' };
    }
  },

  // Enroll New Customer
  async createCustomer(data: { full_name: string; phone: string; status?: 'active' | 'inactive' | 'pending_verification' }): Promise<{ data: CustomerRow | null; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: null };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: 'User not authenticated.' };

      const { data: profile } = await supabase.from('profiles').select('id').eq('auth_user_id', user.id).single();
      if (!profile) return { data: null, error: 'Profile not found.' };

      const { data: agent } = await supabase.from('agents').select('id').eq('profile_id', (profile as any).id).single();
      if (!agent) return { data: null, error: 'Agent record not found.' };

      const customerCode = 'CUST-' + Math.floor(1000 + Math.random() * 9000);

      const { data: customer, error } = await supabase
        .from('customers')
        .insert({
          agent_id: (agent as any).id,
          customer_code: customerCode,
          full_name: data.full_name,
          phone: data.phone,
          status: data.status || 'active'
        } as any)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: customer as CustomerRow, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to enroll customer.' };
    }
  }
};
