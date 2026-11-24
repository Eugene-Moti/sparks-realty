import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

/**
 * Supabase client for Client Components (forms that upload media in the admin,
 * realtime, etc.). Prefer the server client in RSC, route handlers and server actions.
 */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
