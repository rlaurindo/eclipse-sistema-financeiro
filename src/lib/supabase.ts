import { createClient } from '@supabase/supabase-js';

// Each Netlify site uses its own Supabase project. Environment variables still
// take priority when they are available in another deployment environment.
const siteConfigurations: Record<string, { url: string; key: string }> = {
  'rllfinancecontrol.netlify.app': {
    url: 'https://plkfxenzypasfdwbdovo.supabase.co',
    key: 'sb_publishable_Zx0Ee2s4KsxllIrbLdnvmQ_gyIkrv58'
  },
  'talenteclipse.netlify.app': {
    url: 'https://fwaderqmnrmefxdrlthf.supabase.co',
    key: 'sb_publishable_JVFlWR_xvs6IvjoZEmQcVQ_R20dNY9w'
  }
};

const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
const siteConfiguration = siteConfigurations[currentHostname] || siteConfigurations['talenteclipse.netlify.app'];
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || siteConfiguration.url;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || siteConfiguration.key;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}) : null;

