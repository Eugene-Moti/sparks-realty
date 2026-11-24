import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { PropertyPage } from "@/components/property/detail/property-page";
import { getPropertyBySlug, getPropertySlugs, getSimilarProperties } from "@/lib/queries/property-detail";
import { getStayCalendar, stayInfo } from "@/lib/queries/short-stay";
import { listingMetadata } from "@/lib/seo/listing-metadata";

export async function generateStaticParams() {
  const slugs = await getPropertySlugs("short-stays");
  return (slugs.length ? slugs : ["sample-stay"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/short-stays/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return listingMetadata(slug);
}

/** Short-stay listing: the shared property layout plus the availability calendar and booking widget. */
export default async function ShortStayDetailPage({ params }: PageProps<"/short-stays/[slug]">) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();
  if (property.listingType !== "short_stay") permanentRedirect(property.href);

  const [similar, blocks] = await Promise.all([getSimilarProperties(property), getStayCalendar(property.id)]);
  return <PropertyPage property={property} similar={similar} stay={stayInfo(property, blocks)} />;
}
