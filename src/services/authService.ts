import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { Database } from '../types/database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Agent = Database['public']['Tables']['agents']['Row'];

export interface AuthSessionData {
  user: any;
  profile: Profile | null;
  agent: Agent | null;
}

export const authService = {
  // Email & Password / Identifier Authentication - Sign In
  async signInWithEmail(identifier: string, password?: string): Promise<{ data: AuthSessionData | null; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: null };
    }

    try {
      const cleanIdent = identifier.trim();

      // 1. Try Supabase Auth password first if identifier is an email and password is provided
      if (cleanIdent.includes('@') && password) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanIdent,
          password
        });

        if (!authError && authData?.user) {
          const sessionData = await authService.getCurrentAgentSession();
          if (sessionData?.agent) return { data: sessionData, error: null };
        }
      }

      // 2. Direct Profile & Agent lookup by email, phone, agent_code, or name in Supabase
      let profile: any = null;
      let agentRecord: any = null;

      // Check if identifier matches agent_code directly
      const { data: directAgent } = await supabase
        .from('agents')
        .select('*')
        .eq('agent_code', cleanIdent)
        .maybeSingle();

      if (directAgent) {
        agentRecord = directAgent;
        if (directAgent.profile_id) {
          const { data: p } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', directAgent.profile_id)
            .maybeSingle();
          profile = p;
        }
      } else {
        // Search in profiles table by email, phone, or name
        const { data: pList } = await supabase
          .from('profiles')
          .select('*')
          .or(`email.ilike.%${cleanIdent}%,phone.eq.${cleanIdent},full_name.ilike.%${cleanIdent}%`)
          .limit(1);

        if (pList && pList.length > 0) {
          profile = pList[0];
          const { data: ag } = await supabase
            .from('agents')
            .select('*')
            .eq('profile_id', profile.id)
            .maybeSingle();
          agentRecord = ag;
        }
      }

      if (agentRecord) {
        // Activate RLS agent context so DB-level policies block other agents' data
        try {
          await supabase.rpc('set_agent_context' as any, { agent_uuid: agentRecord.id });
        } catch (_) { /* non-blocking */ }
        return {
          data: {
            user: null,
            profile: profile as Profile,
            agent: agentRecord as Agent
          },
          error: null
        };
      }

      return { data: null, error: 'Agent account not found. Please check your credentials or register a new account.' };
    } catch (err: any) {
      console.error('Error during signInWithEmail:', err);
      return { data: null, error: null };
    }
  },

  // Email & Password Registration - Sign Up
  async signUpWithEmail(
    email: string, 
    password: string, 
    fullName: string, 
    phone: string
  ): Promise<{ data: AuthSessionData | null; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: null };
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone
          }
        }
      });

      if (authError) {
        return { data: null, error: authError.message };
      }

      if (!authData.user) {
        return { data: null, error: 'Failed to create user account.' };
      }

      // Create / Upsert Profile record
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          auth_user_id: authData.user.id,
          full_name: fullName,
          email: email,
          phone: phone,
          role: 'agent',
          status: 'active'
        }, { onConflict: 'email' })
        .select('*')
        .single();

      const profileId = profile?.id || authData.user.id;
      const agentCode = 'AG-' + Math.floor(10000 + Math.random() * 90000);

      // Create / Upsert Agent record
      const { data: agentRecord } = await supabase
        .from('agents')
        .upsert({
          profile_id: profileId,
          agent_code: agentCode,
          balance: 0.00,
          pending_balance: 0.00,
          total_deposit: 0.00,
          total_withdrawal: 0.00,
          total_commission: 0.00,
          commission_rate: 0.0150,
          verification_status: 'verified'
        }, { onConflict: 'agent_code' })
        .select('*')
        .single();

      return { 
        data: { 
          user: authData.user, 
          profile: profile as Profile, 
          agent: agentRecord as Agent 
        }, 
        error: null 
      };
    } catch (err: any) {
      return { data: null, error: err.message || 'Account registration failed.' };
    }
  },

  // Phone OTP Authentication (Optional)
  async signInWithOtp(phone: string): Promise<{ success: boolean; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { success: true, error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone
      });
      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send OTP.' };
    }
  },

  async verifyOtp(phone: string, token: string): Promise<{ data: AuthSessionData | null; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: null };
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms'
      });

      if (error) return { data: null, error: error.message };
      const sessionData = await authService.getCurrentAgentSession();
      return { data: sessionData, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'OTP verification failed.' };
    }
  },

  // Password Reset
  async resetPassword(email: string): Promise<{ success: boolean; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { success: true, error: null };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password reset request failed.' };
    }
  },

  // Fetch Current Session & Agent Context
  async getCurrentAgentSession(): Promise<AuthSessionData | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) return { user, profile: null, agent: null };

      const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('profile_id', (profile as any).id)
        .single();

      return { user, profile: profile as Profile, agent: agent as Agent };
    } catch (err) {
      console.error('Error fetching current agent session:', err);
      return null;
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
  }
};
