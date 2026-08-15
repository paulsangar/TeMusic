// ============================================================
// Supabase Server Client
// Uses service role key — only used in API routes (server-side)
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Get a singleton Supabase client for server-side use.
 * Uses the service role key for full access — never expose on client.
 */
export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error('Supabase URL is not configured');
  if (!key) throw new Error('Supabase server key is not configured');

  supabaseInstance = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseInstance;
}
