import type { EnquiryKind, EnquiryStatus, ListingStatus } from "@/types/db";
import type { PillTone } from "@/components/admin/ui";

export const enquiryKindLabels: Record<EnquiryKind, string> = {
  general: "General",
  property: "Listing question",
  viewing: "Viewing request",
  short_stay: "Short-stay booking",
  list_with_us: "List with us",
  diaspora: "Diaspora",
};

export const ENQUIRY_COLUMNS = ["new", "contacted", "qualified", "closed"] as const satisfies readonly EnquiryStatus[];

export const enquiryStatusLabels: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  closed: "Closed",
  spam: "Spam",
};

export const enquiryStatusTones: Record<EnquiryStatus, PillTone> = {
  new: "green",
  contacted: "blue",
  qualified: "gold",
  closed: "muted",
  spam: "danger",
};

export const listingStatusLabels: Record<ListingStatus, string> = {
  draft: "Draft",
  published: "Published",
  under_offer: "Under offer",
  sold: "Sold",
  let: "Let",
  archived: "Archived",
};

export const listingStatusTones: Record<ListingStatus, PillTone> = {
  draft: "muted",
  published: "green",
  under_offer: "gold",
  sold: "ink",
  let: "ink",
  archived: "danger",
};

/** Group raw `source` values (page paths, "admin", utm) into readable buckets. */
export function sourceLabel(source: string | null): string {
  if (!source) return "Unknown";
  if (source.startsWith("admin:")) {
    const channel = source.slice(6) as (typeof LOG_CHANNELS)[number];
    return logChannelLabels[channel] ?? "Logged by staff";
  }
  if (source === "admin") return "Logged by staff";
  if (source.startsWith("/short-stays/")) return "Short-stay pages";
  if (source.startsWith("/properties/")) return "Listing pages";
  if (source === "/" || source.startsWith("/#")) return "Homepage";
  if (source.startsWith("/contact")) return "Contact page";
  if (source.startsWith("/diaspora")) return "Diaspora page";
  if (source.startsWith("/list-with-us") || source.startsWith("/sell")) return "List with us";
  if (source.startsWith("/areas")) return "Area guides";
  if (source.startsWith("utm:")) return `Campaign: ${source.slice(4)}`;
  return source.startsWith("/") ? `Page ${source.split("?")[0]}` : source;
}

const relFmt = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });

/** "3 hours ago", "yesterday" — for inboxes. */
export function timeAgo(iso: string, now = Date.now()): string {
  const diff = (new Date(iso).getTime() - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return "just now";
  if (abs < 3600) return relFmt.format(Math.round(diff / 60), "minute");
  if (abs < 86_400) return relFmt.format(Math.round(diff / 3600), "hour");
  if (abs < 30 * 86_400) return relFmt.format(Math.round(diff / 86_400), "day");
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Nairobi" }).format(new Date(iso));
}

/** How a staff-logged lead reached us (stored as source "admin:<channel>"). */
export const LOG_CHANNELS = ["phone", "whatsapp", "walk_in", "email", "social", "referral"] as const;
export const logChannelLabels: Record<(typeof LOG_CHANNELS)[number], string> = {
  phone: "Phone call",
  whatsapp: "WhatsApp",
  walk_in: "Walk-in / office",
  email: "Email",
  social: "Instagram / TikTok / Facebook",
  referral: "Referral",
};

export const POST_CATEGORIES = ["Market insight", "Area guide", "Buying guide", "Renting guide", "Diaspora", "Short stays", "Company news"] as const;

export type AdminTestimonial = {
  id: string;
  author: string;
  role: string | null;
  quote: string;
  rating: number | null;
  avatar_url: string | null;
  published: boolean;
  sort_order: number;
};

export type AdminVideo = {
  id: string;
  platform: string;
  url: string;
  title: string | null;
  thumbnail: string | null;
  property_id: string | null;
  is_featured: boolean;
  sort_order: number;
};
