import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { HONEYPOT_FIELD } from "@/lib/validation/consent";
import { subscribeSchema } from "@/lib/validation/subscribe";

/** Footer "new listings by email" signup → saved_searches (kind: newsletter). */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: pretend success so bots don't learn anything.
  if (typeof body[HONEYPOT_FIELD] === "string" && body[HONEYPOT_FIELD].length > 0) {
    return NextResponse.json({ ok: true });
  }

  const limited = rateLimit(`subscribe:${clientIp(request.headers)}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please check the form.", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 422 },
    );
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ ok: false, error: "Signups are not available yet." }, { status: 503 });
  }

  const { email, consent_given, marketing_opt_in } = parsed.data;
  const { error } = await createPublicClient()
    .from("saved_searches")
    .insert({
      email: email.toLowerCase(),
      filters: { kind: "newsletter", source: "footer" },
      consent_given,
      marketing_opt_in,
    });

  if (error) {
    console.error("[subscribe]", error.message);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again or WhatsApp us." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
