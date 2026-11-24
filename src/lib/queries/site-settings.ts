import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { siteConfig } from "@/config/site";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

export const SITE_SETTINGS_TAG = "site-settings";

export type SiteStats = {
  homes_sold: number;
  happy_clients: number;
  years: number;
  areas: number;
};

export type SiteSettings = {
  companyName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  officeHours: string;
  social: { youtube: string; facebook: string; instagram: string; tiktok: string };
  heroHeadline: string;
  heroSubline: string;
  heroVideoUrl: string | null;
  stats: SiteStats;
  usdRate: number;
};

/** Row shape of public.site_settings (replace with generated types after `npm run db:types`). */
type SiteSettingsRow = {
  company_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  office_hours: string | null;
  youtube: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  hero_headline: string | null;
  hero_subline: string | null;
  hero_video_url: string | null;
  stats: Partial<Record<keyof SiteStats, number | string>> | null;
  usd_rate: number | string | null;
};

const fallback: SiteSettings = {
  companyName: siteConfig.name,
  phone: siteConfig.contact.phone.e164,
  whatsapp: siteConfig.contact.whatsapp.number,
  email: siteConfig.contact.email,
  address: siteConfig.contact.address.display,
  officeHours: siteConfig.contact.officeHours,
  social: { ...siteConfig.social },
  heroHeadline: "Find a home that sparks something.",
  heroSubline: siteConfig.tagline,
  heroVideoUrl: null,
  stats: { homes_sold: 0, happy_clients: 0, years: 0, areas: 0 },
  usdRate: siteConfig.defaultUsdRate,
};

function num(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : Number.NaN;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Staff-editable company settings (Admin → Settings). Cached and shared by all
 * pages; admin saves call `revalidateTag(SITE_SETTINGS_TAG)`. Falls back to
 * src/config/site.ts if Supabase is unreachable so the site never breaks.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag(SITE_SETTINGS_TAG);
  cacheLife("hours");

  if (!hasSupabaseEnv()) return fallback;

  try {
    const { data, error } = await createPublicClient()
      .from("site_settings")
      .select(
        "company_name, phone, whatsapp, email, address, office_hours, youtube, facebook, instagram, tiktok, hero_headline, hero_subline, hero_video_url, stats, usd_rate",
      )
      .eq("id", 1)
      .maybeSingle<SiteSettingsRow>();

    if (error || !data) {
      if (error) console.error("[site-settings]", error.message);
      return fallback;
    }

    const stats = data.stats ?? {};
    return {
      companyName: data.company_name || fallback.companyName,
      phone: data.phone || fallback.phone,
      whatsapp: data.whatsapp || fallback.whatsapp,
      email: data.email || fallback.email,
      address: data.address || fallback.address,
      officeHours: data.office_hours || fallback.officeHours,
      social: {
        youtube: data.youtube || fallback.social.youtube,
        facebook: data.facebook || fallback.social.facebook,
        instagram: data.instagram || fallback.social.instagram,
        tiktok: data.tiktok || fallback.social.tiktok,
      },
      heroHeadline: data.hero_headline || fallback.heroHeadline,
      heroSubline: data.hero_subline || fallback.heroSubline,
      heroVideoUrl: data.hero_video_url || null,
      stats: {
        homes_sold: num(stats.homes_sold),
        happy_clients: num(stats.happy_clients),
        years: num(stats.years),
        areas: num(stats.areas),
      },
      usdRate: num(data.usd_rate) || fallback.usdRate,
    };
  } catch (err) {
    console.error("[site-settings]", err);
    return fallback;
  }
}
