import type { Metadata } from "next";
import { InsightsList } from "@/components/content/insights-list";
import { PageHero } from "@/components/layout/page-hero";
import { getAllPosts } from "@/lib/queries/content";

export const metadata: Metadata = {
  title: "Insights",
  description: "Market notes, area guides and practical advice on buying, renting and investing in Nairobi property — from the Sparks Properties team.",
  alternates: { canonical: "/insights" },
};

export default async function InsightsPage() {
  const posts = await getAllPosts();
  return (
    <>
      <PageHero
        eyebrow="Insights"
        title="Market notes from the ground"
        description="What's happening in Nairobi property, explained plainly — prices, neighbourhoods, buying from abroad and renting well."
        crumbs={[{ name: "Insights", href: "/insights" }]}
      />
      <div className="mx-auto w-full max-w-[90rem] px-4 pb-28 sm:px-6 lg:px-10">
        <InsightsList posts={posts} />
      </div>
    </>
  );
}
