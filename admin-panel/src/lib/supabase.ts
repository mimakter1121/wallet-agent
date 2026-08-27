import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xyoiwvzifgfwvvwdqjsf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5b2l3dnppZmdmd3Z2d2RxanNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2Nzk1NzMsImV4cCI6MjEwMzI1NTU3M30.obMqGZoAmNgHer8aIXGpYQJk3ep0CrnrO4IkKtpYCu0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};
