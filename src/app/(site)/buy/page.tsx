import type { Metadata } from "next";
import { SearchHeader, SearchPage } from "@/components/search/search-page";

export const metadata: Metadata = {
  title: "Homes for sale in Nairobi",
  description:
    "Houses, maisonettes, townhouses, villas and apartments for sale in Nairobi — verified listings with video tours, KES and USD prices.",
  alternates: { canonical: "/buy" },
};

export default function BuyPage({ searchParams }: PageProps<"/buy">) {
  return (
    <SearchPage
      searchParams={searchParams}
      fixed={{ listing: "sale" }}
      basePath="/buy"
      header={
        <SearchHeader
          eyebrow="Buy"
          title="Homes for sale in Nairobi"
          description="Maisonettes, villas, townhouses and apartments — each one visited, filmed and checked by our team, with prices in KES and USD."
        />
      }
    />
  );
}
