import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xyoiwvzifgfwvvwdqjsf.supabase.co';

// Admin panel uses SERVICE_ROLE key to bypass RLS and access all data.
// This key is safe here because the admin panel is protected by Master Admin PIN gate.
// NEVER expose service role key in the wallet agent (user-facing) app.
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5b2l3dnppZmdmd3Z2d2RxanNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2Nzk1NzMsImV4cCI6MjEwMzI1NTU3M30.obMqGZoAmNgHer8aIXGpYQJk3ep0CrnrO4IkKtpYCu0';

// Use service role key if available, otherwise fall back to anon key
const activeKey = supabaseServiceKey || supabaseAnonKey;

export const supabase = createClient(supabaseUrl, activeKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && activeKey);
};
