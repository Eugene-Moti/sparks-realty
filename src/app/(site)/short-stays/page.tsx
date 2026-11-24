import type { Metadata } from "next";
import { SearchHeader, SearchPage } from "@/components/search/search-page";

export const metadata: Metadata = {
  title: "Furnished short stays in Nairobi",
  description:
    "Serviced and furnished short-stay apartments and villas in Nairobi for business trips, visits home and long weekends.",
  alternates: { canonical: "/short-stays" },
};

export default function ShortStaysPage({ searchParams }: PageProps<"/short-stays">) {
  return (
    <SearchPage
      searchParams={searchParams}
      fixed={{ listing: "short_stay" }}
      basePath="/short-stays"
      header={
        <SearchHeader
          eyebrow="Short stays"
          title="Furnished short stays"
          description="Calm, fully furnished homes with fast Wi-Fi and backup power — for business trips, visits home and weekends away. Request to book, or book on WhatsApp."
        />
      }
    />
  );
}
