// ==============================================================================
// Supabase Client Initialization & Configuration Guard
// ==============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  import.meta.env.MODE !== 'test' &&
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-ref.supabase.co' &&
  !supabaseUrl.includes('your-project-ref')
);

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn(
    '[SIGN SMC] Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) ' +
    'are not yet configured or using placeholder values. Real-time persistent auth and database queries ' +
    'require valid Supabase credentials in your .env file.'
  );
}

// Create real client with safe placeholder fallback for build and static checks
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
