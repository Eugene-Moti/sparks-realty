import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

/**
 * Cookie-less anon client for PUBLIC data (published listings, areas, settings)
 * and anonymous inserts (enquiries, saved searches). Safe to call inside
 * `"use cache"` functions because it never reads the request. RLS applies.
 */
export function createPublicClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createSupabaseClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
