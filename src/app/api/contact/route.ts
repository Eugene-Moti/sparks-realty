import { after, NextResponse } from "next/server";
import { z } from "zod";
import { propertyTypeLabels } from "@/lib/labels";
import { notifyNewEnquiry } from "@/lib/notify";
import { getSiteSettings } from "@/lib/queries/site-settings";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { EnquiryKind } from "@/types/db";
import { HONEYPOT_FIELD } from "@/lib/validation/consent";
import {
  amountValue,
  goalLabel,
  purposeLabel,
  type SiteEnquiryResponse,
  siteEnquirySchema,
  timelineLabel,
  topicLabel,
} from "@/lib/validation/contact";
import { toE164 } from "@/lib/validation/phone";

const json = (body: SiteEnquiryResponse, init?: ResponseInit) => NextResponse.json(body, init);
const kes = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 });

/**
 * Contact, List with us and Diaspora forms → enquiries.
 * Same protections as /api/enquiries: honeypot, per-IP rate limit, zod on the
 * server, and RLS that only accepts rows with consent_given = true.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: pretend success so bots learn nothing (no row is written).
  if (typeof body[HONEYPOT_FIELD] === "string" && body[HONEYPOT_FIELD].length > 0) {
    return json({ ok: true, id: crypto.randomUUID(), submittedAt: new Date().toISOString() });
  }

  const limited = rateLimit(`enquiry:${clientIp(request.headers)}`, { limit: 6, windowMs: 10 * 60_000 });
  if (!limited.ok) {
    return json(
      { ok: false, error: "Too many requests. Please try again in a few minutes, or WhatsApp us." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  const parsed = siteEnquirySchema.safeParse(body);
  if (!parsed.success) {
    return json({ ok: false, error: "Please check the form.", fieldErrors: z.flattenError(parsed.error).fieldErrors }, { status: 422 });
  }
  if (!hasSupabaseEnv()) {
    return json({ ok: false, error: "The form isn't available yet. Please WhatsApp us." }, { status: 503 });
  }

  const v = parsed.data;
  const id = crypto.randomUUID();
  const lines: string[] = [];
  let kind: EnquiryKind = "general";
  let source = "/contact";
  let country: string | null = null;
  let budgetMax: number | null = null;

  if (v.intent === "contact") {
    kind = v.topic === "viewing" || v.topic === "video_viewing" ? "viewing" : "general";
    lines.push(`Topic: ${topicLabel(v.topic)}`);
  } else if (v.intent === "list_with_us") {
    kind = "list_with_us";
    source = "/list-with-us";
    const price = amountValue(v.expected_price);
    lines.push(
      `Wants to: ${purposeLabel(v.purpose)}`,
      `Property: ${propertyTypeLabels[v.property_type]}${v.bedrooms ? ` · ${v.bedrooms} bed` : ""} · ${v.area}`,
      ...(price ? [`Expected ${v.purpose === "sell" ? "price" : v.purpose === "let" ? "rent" : "nightly rate"}: KES ${kes.format(price)}`] : []),
    );
  } else {
    kind = "diaspora";
    source = "/diaspora";
    country = v.country;
    const amount = amountValue(v.budget);
    if (amount) {
      const { usdRate } = await getSiteSettings();
      budgetMax = v.budget_currency === "USD" ? Math.round(amount * usdRate) : amount;
    }
    lines.push(
      `Goal: ${goalLabel(v.goal)}`,
      `Timeline: ${timelineLabel(v.timeline)}`,
      ...(amount ? [`Budget: ${v.budget_currency} ${kes.format(amount)}${v.budget_currency === "USD" && budgetMax ? ` (≈ KES ${kes.format(budgetMax)})` : ""}`] : []),
      ...(v.video_call ? ["Would like a video-call viewing"] : []),
    );
  }

  const details = lines.join("\n");
  const phone = toE164(v.phone_country, v.phone);
  const email = v.email ? v.email.toLowerCase() : null;

  // Anonymous visitors can insert but not read enquiries (RLS), so the ID is made here.
  const { error } = await createPublicClient()
    .from("enquiries")
    .insert({
      id,
      kind,
      full_name: v.full_name,
      phone,
      email,
      country,
      budget_max_kes: budgetMax,
      message: [details, v.message].filter(Boolean).join("\n\n"),
      source,
      consent_given: v.consent_given,
      marketing_opt_in: v.marketing_opt_in,
    });
  if (error) {
    console.error("[contact]", error.message);
    return json({ ok: false, error: "Something went wrong. Please try again or WhatsApp us." }, { status: 500 });
  }

  after(() => notifyNewEnquiry({ id, kind, name: v.full_name, phone, email, message: v.message || null, details }));

  return json({ ok: true, id, submittedAt: new Date().toISOString() });
}
