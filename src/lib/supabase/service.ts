import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

/**
 * Service-role client — BYPASSES RLS. Server-only, and only for the few things
 * RLS can't express: inviting staff (auth admin API) and reading staff emails.
 * Every caller must check the signed-in user's role first (requireStaffAction).
 */
export function createServiceClient() {
  const { url } = getSupabaseEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function hasServiceKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
