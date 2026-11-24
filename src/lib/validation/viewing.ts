import { z } from "zod";
import { consentShape } from "./consent";
import { ISO_DATE, addDays, nairobiToday } from "@/lib/dates";
import { DIAL_CODES, toE164 } from "./phone";

export { addDays, nairobiToday };

export const VIEWING_SLOTS = [
  { value: "morning", label: "Morning", hint: "9am – 12pm" },
  { value: "midday", label: "Midday", hint: "12 – 2pm" },
  { value: "afternoon", label: "Afternoon", hint: "2 – 5pm" },
  { value: "evening", label: "Evening", hint: "5 – 7pm" },
] as const;
export type ViewingSlot = (typeof VIEWING_SLOTS)[number]["value"];

export const VIEWING_MODES = [
  { value: "in_person", label: "In person" },
  { value: "video", label: "Video call" },
] as const;
export type ViewingMode = (typeof VIEWING_MODES)[number]["value"];

export const slotLabel = (v: string) => {
  const s = VIEWING_SLOTS.find((x) => x.value === v);
  return s ? `${s.label} (${s.hint})` : v;
};
export const modeLabel = (v: string) => VIEWING_MODES.find((x) => x.value === v)?.label ?? v;

/** Viewings can be requested up to this many days ahead. */
export const VIEWING_DAYS_AHEAD = 30;


/**
 * Listing enquiry form (client + server). `intent: "viewing"` requires a
 * preferred day, time slot and viewing mode; `"enquiry"` is a plain question
 * about the listing (sold/let homes, and short stays until Phase 5).
 */
export const listingEnquirySchema = z
  .object({
    intent: z.enum(["viewing", "enquiry"]),
    property_id: z.uuid(),
    full_name: z.string().trim().min(2, "Please tell us your name.").max(120),
    phone_country: z.enum(DIAL_CODES),
    phone: z.string().trim().min(6, "Please enter a phone number we can call or WhatsApp.").max(24),
    email: z.union([z.literal(""), z.email("That email doesn't look right.").max(160)]),
    preferred_date: z.string(),
    preferred_time: z.string(),
    viewing_mode: z.string(),
    message: z.string().trim().max(2000, "Please keep your message under 2,000 characters."),
    ...consentShape,
  })
  .superRefine((v, ctx) => {
    if (!toE164(v.phone_country, v.phone)) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "That phone number doesn't look right." });
    }
    if (v.intent !== "viewing") return;

    const today = nairobiToday();
    if (!ISO_DATE.test(v.preferred_date)) {
      ctx.addIssue({ code: "custom", path: ["preferred_date"], message: "Pick a day for the viewing." });
    } else if (v.preferred_date < today || v.preferred_date > addDays(today, VIEWING_DAYS_AHEAD)) {
      ctx.addIssue({ code: "custom", path: ["preferred_date"], message: "Pick a day within the next month." });
    }
    if (!VIEWING_SLOTS.some((s) => s.value === v.preferred_time)) {
      ctx.addIssue({ code: "custom", path: ["preferred_time"], message: "Pick a time of day." });
    }
    if (!VIEWING_MODES.some((m) => m.value === v.viewing_mode)) {
      ctx.addIssue({ code: "custom", path: ["viewing_mode"], message: "Choose in person or video call." });
    }
  });

export type ListingEnquiryValues = z.infer<typeof listingEnquirySchema>;

export type ListingEnquiryResponse =
  | { ok: true; id: string; submittedAt: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
