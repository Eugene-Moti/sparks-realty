import type { Metadata } from "next";
import { FavouritesView } from "@/components/saved/favourites-view";
import { SearchHeader } from "@/components/search/search-page";

export const metadata: Metadata = {
  title: "Your favourites",
  robots: { index: false, follow: true },
};

export default function FavouritesPage() {
  return (
    <>
      <SearchHeader
        eyebrow="Favourites"
        title="Homes you've saved"
        description="Saved on this device only. Send the list to an agent on WhatsApp when you're ready to view."
      />
      <div className="mx-auto w-full max-w-[90rem] px-4 pb-24 sm:px-6 lg:px-10">
        <FavouritesView />
      </div>
    </>
  );
}
