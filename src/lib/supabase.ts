import { createClient } from '@supabase/supabase-js';

// Publishable frontend configuration. Environment variables still take priority
// when they are available in another deployment environment.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fwaderqmnrmefxdrlthf.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_JVFlWR_xvs6IvjoZEmQcVQ_R20dNY9w';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}) : null;

