import type { Metadata } from "next";
import { SettingsForm, type SettingsValues } from "@/components/admin/settings-form";
import { requireStaff } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { supabase } = await requireStaff(["admin"]);
  const { data } = await supabase
    .from("site_settings")
    .select(
      "company_name, phone, whatsapp, email, address, office_hours, youtube, facebook, instagram, tiktok, hero_headline, hero_subline, hero_video_url, stats, usd_rate, updated_at",
    )
    .eq("id", 1)
    .maybeSingle();
  const s = (data ?? {}) as Record<string, unknown>;
  const stats = (s.stats ?? {}) as Record<string, number | string>;
  const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

  const values: SettingsValues = {
    company_name: str(s.company_name) || "Sparks Properties",
    phone: str(s.phone),
    whatsapp: str(s.whatsapp),
    email: str(s.email),
    address: str(s.address),
    office_hours: str(s.office_hours),
    youtube: str(s.youtube),
    facebook: str(s.facebook),
    instagram: str(s.instagram),
    tiktok: str(s.tiktok),
    hero_headline: str(s.hero_headline),
    hero_subline: str(s.hero_subline),
    hero_video_url: str(s.hero_video_url),
    stats: {
      homes_sold: str(stats.homes_sold ?? 0),
      happy_clients: str(stats.happy_clients ?? 0),
      years: str(stats.years ?? 0),
      areas: str(stats.areas ?? 0),
    },
    usd_rate: str(s.usd_rate),
  };

  return <SettingsForm initial={values} updatedAt={(s.updated_at as string | undefined) ?? null} />;
}
