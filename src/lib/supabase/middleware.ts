import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseEnv, hasSupabaseEnv } from "./env";

/** Admin routes reachable without a session (the login flow itself). */
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/auth"];

function isProtectedAdminPath(pathname: string): boolean {
  if (pathname !== "/admin" && !pathname.startsWith("/admin/")) return false;
  return !PUBLIC_ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Refreshes the Supabase auth session on every matched request and keeps
 * signed-out visitors out of /admin. Called from src/proxy.ts.
 *
 * This only checks that a user is signed in. Whether they are staff (a row in
 * `profiles`) and which role they hold is enforced again in the admin layout
 * and by RLS — never rely on the proxy alone for authorization.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!hasSupabaseEnv()) {
    // Local dev before keys are added: public pages still work, /admin stays shut.
    if (isProtectedAdminPath(request.nextUrl.pathname)) {
      return new NextResponse("Supabase is not configured.", { status: 503 });
    }
    return response;
  }

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Auth-cookie responses must never be cached by a CDN.
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // Do not run code between createServerClient and getClaims(): it validates the
  // JWT and refreshes an expired session, writing new cookies via setAll above.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user && isProtectedAdminPath(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    const redirect = NextResponse.redirect(loginUrl);
    // Carry over any refreshed/cleared auth cookies.
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  }

  // Return `response` as-is so the refreshed cookies reach the browser.
  return response;
}
