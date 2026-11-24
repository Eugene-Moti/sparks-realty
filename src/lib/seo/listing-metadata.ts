import "server-only";

import type { Metadata } from "next";
import { getPropertyBySlug } from "@/lib/queries/property-detail";
import { listingDescription } from "./listing";

/** Metadata for a listing page. The OG image comes from the route's opengraph-image.tsx. */
export async function listingMetadata(slug: string): Promise<Metadata> {
  const p = await getPropertyBySlug(slug);
  if (!p) return { title: "Listing not found", robots: { index: false } };
  const title = p.seoTitle ?? p.title;
  const description = listingDescription(p);
  return {
    title,
    description,
    alternates: { canonical: p.href },
    openGraph: { type: "website", url: p.href, title, description, siteName: "Sparks Properties" },
    twitter: { card: "summary_large_image", title, description },
  };
}
