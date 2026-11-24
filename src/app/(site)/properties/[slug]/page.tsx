import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { PropertyPage } from "@/components/property/detail/property-page";
import { getPropertyBySlug, getPropertySlugs, getSimilarProperties } from "@/lib/queries/property-detail";
import { listingMetadata } from "@/lib/seo/listing-metadata";

export async function generateStaticParams() {
  const slugs = await getPropertySlugs("properties");
  // At least one param is required for build-time validation with Cache Components.
  return (slugs.length ? slugs : ["sample-listing"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/properties/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return listingMetadata(slug);
}

/** Sale and long-term rental listings. Short stays live at /short-stays/[slug]. */
export default async function PropertyDetailPage({ params }: PageProps<"/properties/[slug]">) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();
  if (property.listingType === "short_stay") permanentRedirect(property.href);

  const similar = await getSimilarProperties(property);
  return <PropertyPage property={property} similar={similar} />;
}
