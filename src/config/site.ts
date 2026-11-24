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
    "Sparks Properties is a Nairobi real-estate agency in Kileleshwa — homes for sale, long-term rentals and furnished short stays in Kileleshwa, Westlands, Kilimani, Lavington, Riverside, Karen and beyond.",
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
      locality: "Kileleshwa",
      city: "Nairobi",
      country: "Kenya",
      countryCode: "KE",
      display: "Kileleshwa, Nairobi, Kenya",
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
