import type { Metadata } from "next";
import { AreasStrip } from "@/components/home/areas-strip";
import { DiasporaBand } from "@/components/home/diaspora-band";
import { FeaturedListings } from "@/components/home/featured-listings";
import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { HouseTours } from "@/components/home/house-tours";
import { HydrateWhenVisible } from "@/components/motion/hydrate-when-visible";
import { LatestInsights } from "@/components/home/latest-insights";
import { TestimonialsCarousel } from "@/components/home/testimonials-carousel";
import { ThreeWays } from "@/components/home/three-ways";
import { TrustStrip } from "@/components/home/trust-strip";
import { absoluteUrl, siteConfig } from "@/config/site";
import { getAreasWithStats } from "@/lib/queries/areas";
import { getLatestPosts, getTestimonials, getVideos } from "@/lib/queries/content";
import { getHomepageListings, getListingCounts } from "@/lib/queries/properties";
import { getSiteSettings } from "@/lib/queries/site-settings";
import type { ListingType } from "@/types/db";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Area tabs on the featured section, in this order. */
const FEATURED_AREA_SLUGS = ["kileleshwa", "westlands", "kilimani", "lavington", "riverside", "karen"];

export default async function HomePage() {
  // All cached ("use cache" + tags), so the page prerenders into the static shell.
  const [settings, listings, counts, areas, testimonials, posts, videos] = await Promise.all([
    getSiteSettings(),
    getHomepageListings(),
    getListingCounts(),
    getAreasWithStats(),
    getTestimonials(),
    getLatestPosts(3),
    getVideos(8),
  ]);

  const available = listings.filter((l) => l.status === "published");
  const heroImages = (available.filter((l) => l.isFeatured).length ? available.filter((l) => l.isFeatured) : available)
    .flatMap((l) => (l.images[0] ? [{ src: l.images[0].src, alt: l.title }] : []))
    .slice(0, 5);

  const tileImages: Partial<Record<ListingType, string>> = {};
  for (const l of available) {
    if (!tileImages[l.listingType] && l.images[0]) tileImages[l.listingType] = l.images[0].src;
  }

  const featuredTabs = FEATURED_AREA_SLUGS.flatMap((slug) => {
    const a = areas.find((x) => x.slug === slug);
    return a ? [{ slug: a.slug, name: a.name }] : [];
  });
  const stripAreas = areas.filter((a) => a.heroImage || a.listingCount > 0).slice(0, 8);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${absoluteUrl("/")}#agent`,
    name: settings.companyName,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icon-512.png"),
    image: absoluteUrl("/og-image.jpg"),
    telephone: settings.phone,
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.address.streetAddress,
      addressLocality: siteConfig.contact.address.city,
      addressCountry: siteConfig.contact.address.countryCode,
    },
    hasMap: siteConfig.contact.maps.directionsUrl,
    areaServed: areas.map((a) => a.name),
    sameAs: Object.values(settings.social),
  };

  // Sections below the hero hydrate only as they approach the viewport (HydrateWhenVisible):
  // their HTML shows at once, but their JavaScript work doesn't block the first load.
  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD; "<" is escaped so the payload cannot close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Hero
        headline={settings.heroHeadline}
        subline={settings.heroSubline}
        videoUrl={settings.heroVideoUrl}
        images={heroImages}
        areas={areas.map((a) => ({ slug: a.slug, name: a.name }))}
      />
      <HydrateWhenVisible><TrustStrip stats={settings.stats} areaNames={areas.map((a) => a.name)} /></HydrateWhenVisible>
      <HydrateWhenVisible className="cv-auto"><FeaturedListings listings={listings} tabs={featuredTabs} /></HydrateWhenVisible>
      <HydrateWhenVisible className="cv-auto"><ThreeWays counts={counts} images={tileImages} /></HydrateWhenVisible>
      <HydrateWhenVisible rootMargin="1200px 0px"><AreasStrip areas={stripAreas} /></HydrateWhenVisible>
      <HydrateWhenVisible className="cv-auto"><HouseTours videos={videos} youtube={settings.social.youtube} tiktok={settings.social.tiktok} /></HydrateWhenVisible>
      <HydrateWhenVisible className="cv-auto"><DiasporaBand usdRate={settings.usdRate} image={heroImages[1]?.src ?? heroImages[0]?.src ?? null} /></HydrateWhenVisible>
      <HydrateWhenVisible className="cv-auto"><TestimonialsCarousel testimonials={testimonials} /></HydrateWhenVisible>
      <HydrateWhenVisible className="cv-auto"><LatestInsights posts={posts} /></HydrateWhenVisible>
      <HydrateWhenVisible className="cv-auto"><FinalCta settings={settings} /></HydrateWhenVisible>
    </>
  );
}
