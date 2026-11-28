/**
 * Single source of truth for company facts, navigation and social links.
 * Values here are the fallback; staff can override contacts/socials in
 * Admin → Settings (stored in `site_settings`).
 *
 * Never hardcode a domain: every absolute URL goes through `siteUrl` / `absoluteUrl`,
 * which read NEXT_PUBLIC_SITE_URL (localhost in dev, the *.vercel.app URL in
 * production until a custom domain is added).
 */

function resolveSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  // Safety net if the var is forgotten on Vercel: its system env vars (exposed to the
  // browser with the NEXT_PUBLIC_ prefix) give the *.vercel.app production host.
  const vercelHost = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelHost) return `https://${vercelHost}`;
  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

/** Build an absolute URL on this site, e.g. absoluteUrl("/properties/x"). */
export function absoluteUrl(path = "/"): string {
  return new URL(path, `${siteUrl}/`).toString();
}

const PHONE_E164 = "+254792573443";

export const siteConfig = {
  name: "Sparks Properties",
  shortName: "Sparks Properties",
  tagline: "Homes for sale, long-term rentals and short stays across Nairobi.",
  description:
    "Sparks Properties is a Nairobi real-estate agency on Arboretum Drive — homes for sale, long-term rentals and furnished short stays in Kileleshwa, Westlands, Kilimani, Lavington, Riverside, Karen and beyond.",
  locale: "en_KE",

  contact: {
    phone: {
      e164: PHONE_E164,
      display: "+254 792 573 443",
      href: `tel:${PHONE_E164}`,
    },
    whatsapp: {
      /** Digits only, as wa.me expects. */
      number: "254792573443",
      display: "+254 792 573 443",
      href: "https://wa.me/254792573443",
    },
    email: "sparkspropertieshomes@gmail.com",
    address: {
      building: "Arbor House Business Centre",
      street: "Arboretum Drive",
      streetAddress: "Arbor House Business Centre, Arboretum Drive",
      city: "Nairobi",
      country: "Kenya",
      countryCode: "KE",
      display: "Arbor House Business Centre, Arboretum Drive, Nairobi",
    },
    /** The office's Google Maps place (cid from the "Share → Embed a map" code). */
    maps: {
      directionsUrl: "https://maps.google.com/?cid=11065213940073806534",
      embedUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7977.635259296739!2d36.78933314461508!3d-1.2832760186435834!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f17341ce3ffff%3A0x998f8973d5ccbac6!2sArbor%20House%20Business%20Centre!5e0!3m2!1sen!2ske!4v1795522204590!5m2!1sen!2ske",
    },
    officeHours: "Mon–Fri 8:00–18:00 · Sat 9:00–15:00",
  },

  social: {
    youtube: "https://www.youtube.com/@sparkspropertieshomes",
    facebook: "https://www.facebook.com/share/1KwwK8DdwD/",
    instagram: "https://www.instagram.com/sparksproperties",
    tiktok: "https://www.tiktok.com/@sparksproperties",
  },

  /** Default KES per USD when site_settings.usd_rate is unavailable. */
  defaultUsdRate: 129.5,
} as const;

export type NavItem = { label: string; href: string };

export const mainNav: readonly NavItem[] = [
  { label: "Buy", href: "/buy" },
  { label: "Rent", href: "/rent" },
  { label: "Short Stays", href: "/short-stays" },
  { label: "Areas", href: "/areas" },
  { label: "Tours", href: "/tours" },
  { label: "Insights", href: "/insights" },
  { label: "Diaspora", href: "/diaspora" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const primaryCta: NavItem = {
  label: "Book a viewing",
  href: "/contact?intent=viewing",
};

export const footerNav = {
  explore: [
    { label: "Properties for sale", href: "/buy" },
    { label: "Properties to rent", href: "/rent" },
    { label: "Short stays", href: "/short-stays" },
    { label: "Area guides", href: "/areas" },
    { label: "House tours", href: "/tours" },
  ],
  company: [
    { label: "About us", href: "/about" },
    { label: "List with us", href: "/list-with-us" },
    { label: "Buying from abroad", href: "/diaspora" },
    { label: "Insights", href: "/insights" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
} as const satisfies Record<string, readonly NavItem[]>;

export const socialLinks = [
  { platform: "youtube", label: "YouTube", href: siteConfig.social.youtube },
  { platform: "facebook", label: "Facebook", href: siteConfig.social.facebook },
  { platform: "instagram", label: "Instagram", href: siteConfig.social.instagram },
  { platform: "tiktok", label: "TikTok", href: siteConfig.social.tiktok },
] as const;

export type SocialPlatform = (typeof socialLinks)[number]["platform"];
