import { z } from "zod";
import { isIsoDate, nairobiToday } from "@/lib/dates";
import { MAX_NIGHTS, nightsBetween, type StayQuote } from "@/lib/short-stay/stay";
import { consentShape } from "./consent";
import { DIAL_CODES, toE164 } from "./phone";

/**
 * "Request to book" for a short stay (client + server). Listing-specific
 * rules (minimum nights, max guests, closed nights, the price) are checked
 * again on the server against live data — see /api/enquiries.
 */
export const stayRequestSchema = z
  .object({
    intent: z.literal("stay"),
    property_id: z.uuid(),
    check_in: z.string(),
    check_out: z.string(),
    guests: z.number().int().min(1, "Add at least one guest.").max(30),
    full_name: z.string().trim().min(2, "Please tell us your name.").max(120),
    phone_country: z.enum(DIAL_CODES),
    phone: z.string().trim().min(6, "Please enter a phone number we can call or WhatsApp.").max(24),
    email: z.union([z.literal(""), z.email("That email doesn't look right.").max(160)]),
    message: z.string().trim().max(2000, "Please keep your message under 2,000 characters."),
    ...consentShape,
  })
  .superRefine((v, ctx) => {
    if (!toE164(v.phone_country, v.phone)) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "That phone number doesn't look right." });
    }
    if (!isIsoDate(v.check_in) || !isIsoDate(v.check_out)) {
      ctx.addIssue({ code: "custom", path: ["check_in"], message: "Choose your check-in and check-out dates." });
      return;
    }
    if (v.check_in < nairobiToday()) {
      ctx.addIssue({ code: "custom", path: ["check_in"], message: "Check-in can't be in the past." });
    }
    const nights = nightsBetween(v.check_in, v.check_out);
    if (nights < 1 || nights > MAX_NIGHTS) {
      ctx.addIssue({ code: "custom", path: ["check_out"], message: "Choose a check-out date after check-in." });
    }
  });

export type StayRequestValues = z.infer<typeof stayRequestSchema>;

export type StayRequestResponse =
  | { ok: true; id: string; submittedAt: string; quote: StayQuote | null }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
