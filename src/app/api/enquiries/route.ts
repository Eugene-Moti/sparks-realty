import { after, NextResponse } from "next/server";
import { z } from "zod";
import { nairobiToday } from "@/lib/dates";
import { listingHref } from "@/lib/labels";
import { PUBLIC_STATUSES } from "@/lib/queries/properties";
import { fetchStayBlocks } from "@/lib/queries/short-stay";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { quoteStay, quoteSummary, type StayQuote, stayProblems } from "@/lib/short-stay/stay";
import { notifyNewEnquiry } from "@/lib/notify";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { ListingType } from "@/types/db";
import { HONEYPOT_FIELD } from "@/lib/validation/consent";
import { toE164 } from "@/lib/validation/phone";
import { type StayRequestResponse, stayRequestSchema } from "@/lib/validation/stay";
import { type ListingEnquiryResponse, listingEnquirySchema, modeLabel, slotLabel } from "@/lib/validation/viewing";

type Response = ListingEnquiryResponse | StayRequestResponse;

const json = (body: Response, init?: ResponseInit) => NextResponse.json(body, init);

const invalid = (error: z.ZodError) =>
  json({ ok: false, error: "Please check the form.", fieldErrors: z.flattenError(error).fieldErrors }, { status: 422 });

type PropertyRef = {
  id: string;
  slug: string;
  title: string;
  ref_code: string | null;
  listing_type: ListingType;
  price_kes: number | string | null;
  price_on_request: boolean;
  cleaning_fee_kes: number | string | null;
  min_nights: number | null;
  max_guests: number | null;
};

/**
 * Listing forms → enquiries:
 * - intent "viewing" / "enquiry": viewing requests and questions from detail pages;
 * - intent "stay": short-stay "Request to book" (dates, guests, quote re-checked here).
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const isStay = body.intent === "stay";

  // Honeypot: pretend success so bots learn nothing (no row is written).
  if (typeof body[HONEYPOT_FIELD] === "string" && body[HONEYPOT_FIELD].length > 0) {
    return json({ ok: true, id: crypto.randomUUID(), submittedAt: new Date().toISOString(), ...(isStay ? { quote: null } : {}) });
  }

  const limited = rateLimit(`enquiry:${clientIp(request.headers)}`, { limit: 6, windowMs: 10 * 60_000 });
  if (!limited.ok) {
    return json(
      { ok: false, error: "Too many requests. Please try again in a few minutes, or WhatsApp us." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  const parsed = isStay ? stayRequestSchema.safeParse(body) : listingEnquirySchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);
  if (!hasSupabaseEnv()) {
    return json({ ok: false, error: "Requests are not available yet. Please WhatsApp us." }, { status: 503 });
  }

  const supabase = createPublicClient();

  // The listing must exist and be public; it also gives us the source path.
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, slug, title, ref_code, listing_type, price_kes, price_on_request, cleaning_fee_kes, min_nights, max_guests")
    .eq("id", parsed.data.property_id)
    .in("status", PUBLIC_STATUSES)
    .overrideTypes<PropertyRef[], { merge: false }>();
  const listing = property?.[0];
  if (propertyError || !listing) {
    return json({ ok: false, error: "This listing is no longer available." }, { status: 404 });
  }

  const v = parsed.data;
  const base = {
    property_id: listing.id,
    full_name: v.full_name,
    phone: toE164(v.phone_country, v.phone),
    email: v.email ? v.email.toLowerCase() : null,
    source: listingHref(listing.listing_type, listing.slug),
    consent_given: v.consent_given,
    marketing_opt_in: v.marketing_opt_in,
  };

  // Anonymous visitors can insert but not read enquiries (RLS), so the ID is made here.
  const id = crypto.randomUUID();
  let row: Record<string, unknown>;
  let quote: StayQuote | null = null;

  if (v.intent === "stay") {
    if (listing.listing_type !== "short_stay") {
      return json({ ok: false, error: "This home isn't a short stay." }, { status: 400 });
    }
    let blocks: Awaited<ReturnType<typeof fetchStayBlocks>>;
    try {
      blocks = await fetchStayBlocks(listing.id, v.check_in, v.check_out);
    } catch {
      return json({ ok: false, error: "We couldn't check availability. Please try again or WhatsApp us." }, { status: 503 });
    }
    const problems = stayProblems(
      { minNights: Math.max(1, listing.min_nights ?? 1), maxGuests: listing.max_guests, blocks },
      v.check_in,
      v.check_out,
      v.guests,
      nairobiToday(),
    );
    if (problems.length) {
      const fieldErrors: Record<string, string[]> = {};
      for (const p of problems) (fieldErrors[p.field] ??= []).push(p.message);
      return json({ ok: false, error: problems[0].message, fieldErrors }, { status: 409 });
    }

    const nightly = listing.price_on_request ? null : Number(listing.price_kes) || null;
    const cleaning = Number(listing.cleaning_fee_kes) || null;
    quote = quoteStay({ nightlyKes: nightly, cleaningFeeKes: cleaning, blocks }, v.check_in, v.check_out, v.guests);
    const quoteNote = quote ? `Website quote: ${quoteSummary(quote)}. Not yet confirmed or paid.` : "Website quote: price on request.";

    row = {
      ...base,
      id,
      kind: "short_stay",
      check_in: v.check_in,
      check_out: v.check_out,
      guests: v.guests,
      message: [v.message, quoteNote].filter(Boolean).join("\n\n"),
    };
  } else {
    const isViewing = v.intent === "viewing";
    row = {
      ...base,
      id,
      kind: isViewing ? "viewing" : "property",
      message: v.message || null,
      preferred_date: isViewing ? v.preferred_date : null,
      preferred_time: isViewing ? `${slotLabel(v.preferred_time)} · ${modeLabel(v.viewing_mode)}` : null,
    };
  }

  const { error } = await supabase.from("enquiries").insert(row);
  if (error) {
    console.error("[enquiries]", error.message);
    return json({ ok: false, error: "Something went wrong. Please try again or WhatsApp us." }, { status: 500 });
  }

  // Email the office after the response is sent (no-op without RESEND_API_KEY).
  after(() =>
    notifyNewEnquiry({
      id,
      kind: row.kind as "viewing" | "property" | "short_stay",
      name: v.full_name,
      phone: base.phone,
      email: base.email,
      message: v.message || null,
      listing: { title: listing.title, ref: listing.ref_code },
      details:
        v.intent === "stay"
          ? `${v.check_in} → ${v.check_out} · ${v.guests} guest${v.guests === 1 ? "" : "s"}${quote ? ` · ${quoteSummary(quote)}` : ""}`
          : v.intent === "viewing"
            ? `${v.preferred_date} · ${row.preferred_time as string}`
            : null,
    }),
  );

  const submittedAt = new Date().toISOString();
  return json(v.intent === "stay" ? { ok: true, id, submittedAt, quote } : { ok: true, id, submittedAt });
}
