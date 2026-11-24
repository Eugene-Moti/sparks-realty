"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { absoluteUrl } from "@/config/site";
import { clearHits, clientIp, isLimited, rateLimit, recordHit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export type AuthFormState = { error?: string; message?: string; email?: string };

const emailSchema = z.email("Enter your work email.").max(160);

/** Only same-site admin paths after login (no open redirects). */
function safeNext(value: FormDataEntryValue | null): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/admin") && !v.startsWith("//") && !v.startsWith("/admin/login") ? v : "/admin";
}

/**
 * Emails sent (sign-in link, reset): per address and per network. Staff share the
 * office IP, so the per-IP allowance is generous; per-address stops inbox flooding.
 */
async function emailLimited(kind: string, email: string): Promise<boolean> {
  const ip = clientIp(await headers());
  const perEmail = rateLimit(`admin-auth:${kind}:email:${email}`, { limit: 4, windowMs: 15 * 60_000 }).ok;
  const perIp = rateLimit(`admin-auth:${kind}:ip:${ip}`, { limit: 30, windowMs: 15 * 60_000 }).ok;
  return !perEmail || !perIp;
}

const PW_WINDOW = { windowMs: 15 * 60_000 };

export async function signInWithPassword(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!emailSchema.safeParse(email).success || !password) return { error: "Enter your email and password.", email };

  // Only failed attempts count: 6 per account and 30 per network (shared office IP) per 15 minutes.
  const ip = clientIp(await headers());
  const emailKey = `admin-auth:pw-fail:email:${email}`;
  const ipKey = `admin-auth:pw-fail:ip:${ip}`;
  if (isLimited(emailKey, { limit: 6, ...PW_WINDOW }) || isLimited(ipKey, { limit: 30, ...PW_WINDOW })) {
    return { error: "Too many wrong attempts. Wait 15 minutes, or use “Email me a link” / “Forgot your password?”.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    recordHit(emailKey);
    recordHit(ipKey);
    return { error: "That email and password don't match. Try again or use “Email me a link”.", email };
  }
  clearHits(emailKey);
  redirect(safeNext(formData.get("next")));
}

export async function sendMagicLink(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!emailSchema.safeParse(email).success) return { error: "Enter your work email first.", email };
  if (await emailLimited("link", email)) return { error: "Too many attempts. Please wait a few minutes.", email };

  const supabase = await createClient();
  const next = safeNext(formData.get("next"));
  await supabase.auth.signInWithOtp({
    email,
    // Staff accounts are created by invitation only.
    options: { shouldCreateUser: false, emailRedirectTo: absoluteUrl(`/admin/auth/callback?next=${encodeURIComponent(next)}`) },
  });
  // Same message whether or not the email exists (don't reveal who is staff).
  return { message: "If that email belongs to a Sparks Properties team member, a sign-in link is on its way.", email };
}

export async function sendPasswordReset(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!emailSchema.safeParse(email).success) return { error: "Enter your work email first.", email };
  if (await emailLimited("reset", email)) return { error: "Too many attempts. Please wait a few minutes.", email };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: absoluteUrl("/admin/auth/callback?next=/admin/auth/set-password"),
  });
  return { message: "If that email belongs to a Sparks Properties team member, a reset link is on its way.", email };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
