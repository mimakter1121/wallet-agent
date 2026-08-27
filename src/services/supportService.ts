import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { Database } from '../types/database.types';

export type SupportTicketRow = Database['public']['Tables']['support_tickets']['Row'];

export const supportService = {
  // Fetch Tickets
  async getTickets(limit: number = 20): Promise<{ data: SupportTicketRow[]; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return { data: [], error: error.message };
      return { data: (data as any) || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message || 'Failed to fetch tickets.' };
    }
  },

  // Create Ticket
  async createTicket(data: { subject: string; category: string; message: string }): Promise<{ data: SupportTicketRow | null; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: null };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: 'User not authenticated.' };

      const { data: profile } = await supabase.from('profiles').select('id').eq('auth_user_id', user.id).single();
      if (!profile) return { data: null, error: 'Profile not found.' };

      const ticketCode = 'TCK-' + Math.floor(1000 + Math.random() * 9000);

      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert({
          ticket_code: ticketCode,
          user_id: (profile as any).id,
          subject: data.subject,
          category: data.category,
          message: data.message,
          status: 'open'
        } as any)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: ticket as SupportTicketRow, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to create support ticket.' };
    }
  }
};
