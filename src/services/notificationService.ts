import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { Database } from '../types/database.types';

export type NotificationRow = Database['public']['Tables']['notifications']['Row'];

export const notificationService = {
  // Fetch User Notifications
  async getNotifications(limit: number = 30): Promise<{ data: NotificationRow[]; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return { data: [], error: error.message };
      return { data: (data as any) || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message || 'Failed to load notifications.' };
    }
  },

  // Mark single as read
  async markAsRead(notificationId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true } as any)
        .eq('id', notificationId);
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  },

  // Mark all as read
  async markAllAsRead(): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase.from('profiles').select('id').eq('auth_user_id', user.id).single();
      if (!profile) return;

      await supabase
        .from('notifications')
        .update({ is_read: true } as any)
        .eq('user_id', (profile as any).id)
        .eq('is_read', false);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  },

  // Subscribe to Realtime Notifications
  subscribeToNotifications(onNewNotification: (notif: NotificationRow) => void) {
    if (!isSupabaseConfigured()) return () => {};

    const channel = supabase
      .channel('realtime_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          if (payload.new) {
            onNewNotification(payload.new as NotificationRow);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
