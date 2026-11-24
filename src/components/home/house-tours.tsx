import { TiktokLogoIcon, YoutubeLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/motion/reveal";
import { ClickToLoadEmbed } from "@/components/privacy/click-to-load-embed";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { parseVideoUrl } from "@/lib/embeds";
import type { Video } from "@/lib/queries/content";

/** Featured tour + a rail of shorts. Nothing loads from YouTube/TikTok until clicked. */
export function HouseTours({ videos, youtube, tiktok }: { videos: Video[]; youtube: string; tiktok: string }) {
  const playable = videos.filter((v) => parseVideoUrl(v.url));
  if (playable.length === 0) return null;

  const isPortrait = (v: Video) => {
    const parsed = parseVideoUrl(v.url);
    return (
      parsed?.platform === "tiktok" ||
      parsed?.platform === "instagram" ||
      (parsed?.platform === "youtube" && parsed.isShort)
    );
  };
  const featured = playable.find((v) => !isPortrait(v)) ?? playable[0];
  const rail = playable.filter((v) => v.id !== featured.id);

  return (
    <section aria-labelledby="tours-title" className="mx-auto w-full max-w-[90rem] px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
      <SectionHeading
        id="tours-title"
        eyebrow="House tours"
        title="Walk through before you visit"
        description="Every Sparks Properties listing is filmed. Watch full tours and quick walk-throughs — then book the ones you love."
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="gold-outline" size="sm">
              <a href={youtube} target="_blank" rel="noopener noreferrer">
                <YoutubeLogoIcon weight="fill" /> Subscribe
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href={tiktok} target="_blank" rel="noopener noreferrer">
                <TiktokLogoIcon /> TikTok
              </a>
            </Button>
          </div>
        }
      />

      <div className="mt-12 flex flex-col gap-6">
        <Reveal>
          <ClickToLoadEmbed
            url={featured.url}
            title={featured.title ?? "Sparks Properties house tour"}
            thumbnail={featured.thumbnail}
            orientation="landscape"
            className="lg:aspect-[21/9]"
          />
        </Reveal>
        {rail.length ? (
          <Reveal delay={0.1}>
            <p className="eyebrow mb-4">Quick walk-throughs</p>
            <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-none md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-4">
              {rail.slice(0, 4).map((v) => (
                <li key={v.id} className="w-[62vw] max-w-64 shrink-0 snap-start md:w-auto md:max-w-none">
                  <ClickToLoadEmbed
                    url={v.url}
                    title={v.title ?? "Sparks Properties short"}
                    thumbnail={v.thumbnail}
                    orientation="portrait"
                    className="max-w-none"
                  />
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
