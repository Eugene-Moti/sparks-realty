/**
 * Conversion events (GA4). `track()` is a no-op until the visitor has accepted
 * analytics cookies AND NEXT_PUBLIC_GA_MEASUREMENT_ID is set — gtag only exists
 * after <Analytics /> loads it behind the consent gate.
 */
export type AnalyticsEvent =
  | "whatsapp_click"
  | "call_click"
  | "viewing_request"
  | "booking_request"
  | "listing_enquiry"
  | "contact_form"
  | "list_with_us_form"
  | "diaspora_form"
  | "saved_search"
  | "newsletter_signup";

type Gtag = (command: "event" | "config" | "js" | "consent", ...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || null;

export function track(event: AnalyticsEvent, params: Record<string, string | number | boolean | null | undefined> = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  // Never send personal data: only page paths, listing refs and labels.
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== null && v !== undefined));
  window.gtag("event", event, clean);
}
