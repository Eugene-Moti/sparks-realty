import type { Metadata } from "next";
import { SearchHeader, SearchPage } from "@/components/search/search-page";

export const metadata: Metadata = {
  title: "Properties in Nairobi",
  description:
    "Search homes for sale, long-term rentals and furnished short stays across Nairobi — Kileleshwa, Westlands, Kilimani, Lavington, Riverside, Karen and more.",
  alternates: { canonical: "/properties" },
};

export default function PropertiesPage({ searchParams }: PageProps<"/properties">) {
  return (
    <SearchPage
      searchParams={searchParams}
      basePath="/properties"
      header={
        <SearchHeader
          eyebrow="All properties"
          title="Homes across Nairobi"
          description="Every home we're marketing right now — for sale, to rent and for short stays. Filter by area, budget and the things that matter to you."
        />
      }
    />
  );
}
