import { OG_SIZE, renderListingOg } from "@/lib/seo/listing-og";

export const alt = "Sparks Properties listing";
export const size = OG_SIZE;
export const contentType = "image/jpeg";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return renderListingOg(slug);
}
