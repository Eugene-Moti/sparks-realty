import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";
import { getSitemapEntries } from "@/lib/queries/sitemap";

/** Static public pages (no admin, preview, favourites, compare or demo routes). */
const STATIC: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/buy", priority: 0.9, changeFrequency: "daily" },
  { path: "/rent", priority: 0.9, changeFrequency: "daily" },
  { path: "/short-stays", priority: 0.9, changeFrequency: "daily" },
  { path: "/properties", priority: 0.8, changeFrequency: "daily" },
  { path: "/areas", priority: 0.7, changeFrequency: "weekly" },
  { path: "/tours", priority: 0.6, changeFrequency: "weekly" },
  { path: "/insights", priority: 0.6, changeFrequency: "weekly" },
  { path: "/diaspora", priority: 0.6, changeFrequency: "monthly" },
  { path: "/list-with-us", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
];

/** /sitemap.xml — every URL from NEXT_PUBLIC_SITE_URL (never a hardcoded domain). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { listings, areas, posts } = await getSitemapEntries();
  return [
    ...STATIC.map((s) => ({ url: absoluteUrl(s.path), changeFrequency: s.changeFrequency, priority: s.priority })),
    ...listings.map((l) => ({
      url: absoluteUrl(l.path),
      lastModified: l.lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      ...(l.image ? { images: [l.image] } : {}),
    })),
    ...areas.map((a) => ({ url: absoluteUrl(a.path), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...posts.map((p) => ({
      url: absoluteUrl(p.path),
      lastModified: p.lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.5,
      ...(p.image ? { images: [p.image] } : {}),
    })),
  ];
}
