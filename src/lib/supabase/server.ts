import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

/**
 * Supabase client for Server Components, route handlers and server actions.
 * Create a new one per request (never share across requests).
 *
 * With Cache Components enabled, reading cookies is request-time data: call this
 * from a component inside a <Suspense> boundary, not at the top level of a layout.
 */
export async function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Safe to ignore: the proxy (src/proxy.ts) refreshes the session.
        }
      },
    },
  });
}
