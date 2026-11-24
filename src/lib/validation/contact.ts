import { z } from "zod";
import { propertyTypeLabels } from "@/lib/labels";
import type { PropertyType } from "@/types/db";
import { consentShape } from "./consent";
import { DIAL_CODES, toE164 } from "./phone";

/**
 * Site-wide forms that aren't about one listing (client + server):
 * - "contact"       /contact            → enquiries.kind general | viewing
 * - "list_with_us"  /list-with-us       → enquiries.kind list_with_us
 * - "diaspora"      /diaspora           → enquiries.kind diaspora
 * Each posts to /api/contact.
 */

const contactBase = {
  full_name: z.string().trim().min(2, "Please tell us your name.").max(120),
  phone_country: z.enum(DIAL_CODES),
  phone: z.string().trim().min(6, "Please enter a phone number we can call or WhatsApp.").max(24),
  email: z.union([z.literal(""), z.email("That email doesn't look right.").max(160)]),
  message: z.string().trim().max(2000, "Please keep your message under 2,000 characters."),
  ...consentShape,
};

/** Optional whole-number amount typed with commas/spaces ("35,000,000"). */
const optAmount = z
  .string()
  .trim()
  .max(20)
  .refine((v) => v === "" || /^\d{1,13}$/.test(v.replace(/[\s,]/g, "")), "Enter a number, e.g. 150,000.");

export const amountValue = (v: string): number | null => {
  const n = Number(v.replace(/[\s,]/g, ""));
  return v.trim() && Number.isFinite(n) && n > 0 ? n : null;
};

// --- Contact -----------------------------------------------------------------

export const CONTACT_TOPICS = [
  { value: "general", label: "General question" },
  { value: "buying", label: "Buying a home" },
  { value: "renting", label: "Renting a home" },
  { value: "short_stay", label: "Short stay" },
  { value: "viewing", label: "Book a viewing" },
  { value: "video_viewing", label: "Video-call viewing" },
] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number]["value"];
const TOPIC_VALUES = CONTACT_TOPICS.map((t) => t.value) as [ContactTopic, ...ContactTopic[]];
export const topicLabel = (v: string) => CONTACT_TOPICS.find((t) => t.value === v)?.label ?? v;

export const contactSchema = z
  .object({ intent: z.literal("contact"), topic: z.enum(TOPIC_VALUES), ...contactBase })
  .superRefine((v, ctx) => {
    if (!toE164(v.phone_country, v.phone)) ctx.addIssue({ code: "custom", path: ["phone"], message: "That phone number doesn't look right." });
    if (v.topic === "general" && v.message.length < 5) ctx.addIssue({ code: "custom", path: ["message"], message: "Tell us a little about what you need." });
  });

// --- List with us ------------------------------------------------------------

export const LIST_PURPOSES = [
  { value: "sell", label: "Sell" },
  { value: "let", label: "Let long-term" },
  { value: "short_stay", label: "Short-stay letting" },
] as const;
export type ListPurpose = (typeof LIST_PURPOSES)[number]["value"];
const PURPOSE_VALUES = LIST_PURPOSES.map((p) => p.value) as [ListPurpose, ...ListPurpose[]];
export const purposeLabel = (v: string) => LIST_PURPOSES.find((p) => p.value === v)?.label ?? v;

const PROPERTY_TYPE_VALUES = Object.keys(propertyTypeLabels) as [PropertyType, ...PropertyType[]];

export const listWithUsSchema = z
  .object({
    intent: z.literal("list_with_us"),
    purpose: z.enum(PURPOSE_VALUES, { error: "Choose sell, let or short stay." }),
    property_type: z.enum(PROPERTY_TYPE_VALUES, { error: "Choose the type of property." }),
    area: z.string().trim().min(2, "Which area is it in?").max(80),
    bedrooms: z.string().trim().max(2).refine((v) => v === "" || /^\d{1,2}$/.test(v), "Enter a number."),
    expected_price: optAmount,
    ...contactBase,
  })
  .superRefine((v, ctx) => {
    if (!toE164(v.phone_country, v.phone)) ctx.addIssue({ code: "custom", path: ["phone"], message: "That phone number doesn't look right." });
  });

// --- Diaspora ----------------------------------------------------------------

export const DIASPORA_GOALS = [
  { value: "buy_home", label: "Buy a home" },
  { value: "invest", label: "Invest / buy to let" },
  { value: "rent", label: "Rent for family" },
  { value: "manage", label: "Let my property" },
] as const;
export type DiasporaGoal = (typeof DIASPORA_GOALS)[number]["value"];
const GOAL_VALUES = DIASPORA_GOALS.map((g) => g.value) as [DiasporaGoal, ...DiasporaGoal[]];
export const goalLabel = (v: string) => DIASPORA_GOALS.find((g) => g.value === v)?.label ?? v;

export const DIASPORA_TIMELINES = [
  { value: "now", label: "Within 3 months" },
  { value: "soon", label: "3–6 months" },
  { value: "later", label: "6–12 months" },
  { value: "exploring", label: "Just exploring" },
] as const;
export type DiasporaTimeline = (typeof DIASPORA_TIMELINES)[number]["value"];
const TIMELINE_VALUES = DIASPORA_TIMELINES.map((t) => t.value) as [DiasporaTimeline, ...DiasporaTimeline[]];
export const timelineLabel = (v: string) => DIASPORA_TIMELINES.find((t) => t.value === v)?.label ?? v;

export const diasporaSchema = z
  .object({
    intent: z.literal("diaspora"),
    country: z.string().trim().min(2, "Where are you based?").max(80),
    goal: z.enum(GOAL_VALUES, { error: "What would you like to do?" }),
    timeline: z.enum(TIMELINE_VALUES),
    budget: optAmount,
    budget_currency: z.enum(["KES", "USD"]),
    video_call: z.boolean(),
    ...contactBase,
  })
  .superRefine((v, ctx) => {
    if (!toE164(v.phone_country, v.phone)) ctx.addIssue({ code: "custom", path: ["phone"], message: "That phone number doesn't look right." });
  });

export const siteEnquirySchema = z.discriminatedUnion("intent", [contactSchema, listWithUsSchema, diasporaSchema]);

export type ContactValues = z.infer<typeof contactSchema>;
export type ListWithUsValues = z.infer<typeof listWithUsSchema>;
export type DiasporaValues = z.infer<typeof diasporaSchema>;
export type SiteEnquiryValues = z.infer<typeof siteEnquirySchema>;

export type SiteEnquiryResponse =
  | { ok: true; id: string; submittedAt: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
