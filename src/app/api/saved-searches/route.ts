import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { loadSearchParams, serializeSearch } from "@/lib/search/params";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { HONEYPOT_FIELD } from "@/lib/validation/consent";
import { savedSearchSchema } from "@/lib/validation/saved-search";

/** "Alert me when a match is listed" → saved_searches (kind: search). */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  if (typeof body[HONEYPOT_FIELD] === "string" && body[HONEYPOT_FIELD].length > 0) {
    return NextResponse.json({ ok: true });
  }

  const limited = rateLimit(`saved-search:${clientIp(request.headers)}`, { limit: 8, windowMs: 10 * 60_000 });
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  const parsed = savedSearchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please check the form.", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 422 },
    );
  }
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ ok: false, error: "Saved searches are not available yet." }, { status: 503 });
  }

  const { email, query, path, consent_given, marketing_opt_in } = parsed.data;
  // Normalise the stored filters through the same parsers the listing pages use.
  const params = loadSearchParams(new URLSearchParams(query));
  const filters = Object.fromEntries(Object.entries(params).filter(([k]) => k !== "view"));
  const normalisedQuery = serializeSearch({ ...params, view: "grid" }).replace(/^\?/, "");

  const { error } = await createPublicClient()
    .from("saved_searches")
    .insert({
      email: email.toLowerCase(),
      filters: { kind: "search", path, query: normalisedQuery, ...filters },
      consent_given,
      marketing_opt_in,
    });

  if (error) {
    console.error("[saved-searches]", error.message);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again or WhatsApp us." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
