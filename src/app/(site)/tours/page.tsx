import { TiktokLogoIcon, YoutubeLogoIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { ToursGallery } from "@/components/content/tours-gallery";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { getAllVideos } from "@/lib/queries/content";
import { getSiteSettings } from "@/lib/queries/site-settings";

export const metadata: Metadata = {
  title: "House tours",
  description: "Video tours of Sparks Properties homes for sale, rent and short stay in Nairobi — watch before you visit.",
  alternates: { canonical: "/tours" },
};

export default async function ToursPage() {
  const [videos, settings] = await Promise.all([getAllVideos(), getSiteSettings()]);

  return (
    <>
      <PageHero
        eyebrow="House tours"
        title="Walk through before you visit"
        description="Full tours and quick walk-throughs of our homes. Videos only load from YouTube, TikTok or Instagram when you press play."
        crumbs={[{ name: "Tours", href: "/tours" }]}
      >
        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild variant="gold-outline" size="sm">
            <a href={settings.social.youtube} target="_blank" rel="noopener noreferrer">
              <YoutubeLogoIcon weight="fill" /> Subscribe on YouTube
            </a>
          </Button>
          <Button asChild variant="ghost" size="sm" className="border border-hairline">
            <a href={settings.social.tiktok} target="_blank" rel="noopener noreferrer">
              <TiktokLogoIcon /> Follow on TikTok
            </a>
          </Button>
        </div>
      </PageHero>
      <div className="mx-auto w-full max-w-[90rem] px-4 pb-28 sm:px-6 lg:px-10">
        <ToursGallery videos={videos} />
      </div>
    </>
  );
}
