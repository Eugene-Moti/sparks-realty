import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { StaffRole } from "./roles";

export type Staff = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: StaffRole;
  avatarUrl: string | null;
};

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * The signed-in staff member, or null (signed out, or signed in without a
 * profiles row). Reads cookies: call inside a <Suspense> boundary. Deduped per request.
 */
export const getStaff = cache(async (): Promise<Staff | null> => {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url")
    .eq("id", claims.sub)
    .maybeSingle<{ id: string; full_name: string | null; role: StaffRole; avatar_url: string | null }>();
  if (!profile) return null;

  return {
    id: profile.id,
    email: typeof claims.email === "string" ? claims.email : null,
    fullName: profile.full_name,
    role: profile.role,
    avatarUrl: profile.avatar_url,
  };
});

/** Pages: the staff member (with an RLS-scoped client), or a redirect. */
export async function requireStaff(roles?: readonly StaffRole[]): Promise<{ staff: Staff; supabase: ServerClient }> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login?reason=not-staff");
  if (roles && !roles.includes(staff.role)) redirect("/admin?denied=1");
  return { staff, supabase: await createClient() };
}

export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

export const ok = <T,>(data: T): ActionResult<T> => ({ ok: true, data });
export const done: ActionResult<null> = { ok: true, data: null };

/** zod failure → ActionResult with per-field messages. */
export function invalid(error: { issues: { path: PropertyKey[]; message: string }[] }): ActionResult<never> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
}

export class ActionError extends Error {}

/**
 * Server actions: authorise again on every call (never trust the page that
 * rendered the form). Throws ActionError, which `runAction` turns into a result.
 */
export async function requireStaffAction(roles?: readonly StaffRole[]): Promise<{ staff: Staff; supabase: ServerClient }> {
  const staff = await getStaff();
  if (!staff) throw new ActionError("Your session has ended. Please sign in again.");
  if (roles && !roles.includes(staff.role)) throw new ActionError("You don't have permission to do that.");
  return { staff, supabase: await createClient() };
}

/** Wrap an action body: ActionError → friendly message; anything else → logged + generic message. */
export async function runAction<T>(label: string, body: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await body();
  } catch (err) {
    if (err instanceof ActionError) return { ok: false, error: err.message };
    // redirect()/notFound() must propagate.
    if (err && typeof err === "object" && "digest" in err) throw err;
    console.error(`[admin:${label}]`, err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

/** Turn a Supabase/Postgres error into a staff-friendly message (our triggers raise readable ones). */
export function dbError(error: { message: string; code?: string } | null): never | void {
  if (!error) return;
  if (error.code === "23505") throw new ActionError("That already exists — please use a different value.");
  if (error.code === "42501") throw new ActionError("You don't have permission to do that.");
  if (error.code === "P0001") throw new ActionError(error.message);
  console.error("[admin:db]", error);
  throw new ActionError("The database rejected that change. Please check the form and try again.");
}
