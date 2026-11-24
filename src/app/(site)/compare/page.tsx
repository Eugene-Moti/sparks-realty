import type { Metadata } from "next";
import { CompareView } from "@/components/saved/compare-view";
import { SearchHeader } from "@/components/search/search-page";

export const metadata: Metadata = {
  title: "Compare homes",
  robots: { index: false, follow: true },
};

export default function ComparePage() {
  return (
    <>
      <SearchHeader
        eyebrow="Compare"
        title="Side by side"
        description="Up to three homes, with the differences highlighted. Your compare list is saved on this device only."
      />
      <div className="mx-auto w-full max-w-[90rem] px-4 pb-24 sm:px-6 lg:px-10">
        <CompareView />
      </div>
    </>
  );
}
