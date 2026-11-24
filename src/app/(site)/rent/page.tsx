import type { Metadata } from "next";
import { SearchHeader, SearchPage } from "@/components/search/search-page";

export const metadata: Metadata = {
  title: "Homes to rent in Nairobi",
  description:
    "Apartments, maisonettes and houses to rent in Kileleshwa, Westlands, Kilimani, Lavington and across Nairobi — with lifts, boreholes and backup power.",
  alternates: { canonical: "/rent" },
};

export default function RentPage({ searchParams }: PageProps<"/rent">) {
  return (
    <SearchPage
      searchParams={searchParams}
      fixed={{ listing: "rent" }}
      basePath="/rent"
      header={
        <SearchHeader
          eyebrow="Rent"
          title="Homes to rent in Nairobi"
          description="Long-term rentals with the essentials covered — water, backup power and security — viewed in days, not weeks."
        />
      }
    />
  );
}
