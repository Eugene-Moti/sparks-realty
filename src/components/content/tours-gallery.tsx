"use client";

import { ArrowRightIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ClickToLoadEmbed } from "@/components/privacy/click-to-load-embed";
import { Chip, ToggleGroup } from "@/components/ui/toggle-group";
import { parseVideoUrl, type VideoPlatform } from "@/lib/embeds";
import type { TourVideo } from "@/lib/queries/content";

const PLATFORM_LABELS: Record<VideoPlatform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
};

type Item = TourVideo & { portrait: boolean; platformKey: VideoPlatform };

/**
 * All house tours with a platform filter. Every embed is click-to-load:
 * nothing is requested from YouTube/TikTok/Instagram until the visitor presses play.
 */
export function ToursGallery({ videos }: { videos: TourVideo[] }) {
  const items = useMemo<Item[]>(
    () =>
      videos.flatMap((v) => {
        const p = parseVideoUrl(v.url);
        if (!p) return [];
        const portrait = p.platform === "tiktok" || p.platform === "instagram" || (p.platform === "youtube" && p.isShort);
        return [{ ...v, portrait, platformKey: p.platform }];
      }),
    [videos],
  );
  const platforms = (Object.keys(PLATFORM_LABELS) as VideoPlatform[]).filter((k) => items.some((i) => i.platformKey === k));
  const [platform, setPlatform] = useState<VideoPlatform | "all">("all");
  const shown = platform === "all" ? items : items.filter((i) => i.platformKey === platform);
  const tours = shown.filter((i) => !i.portrait);
  const shorts = shown.filter((i) => i.portrait);

  if (!items.length) {
    return <p className="rounded-(--radius-card) border border-hairline border-dashed p-10 text-center text-muted">New tours are on the way — check back soon.</p>;
  }

  return (
    <div className="flex flex-col gap-14">
      {platforms.length > 1 ? (
        <ToggleGroup
          type="single"
          value={platform}
          onValueChange={(v) => v && setPlatform(v as VideoPlatform | "all")}
          aria-label="Filter by platform"
          className="flex flex-wrap gap-2"
        >
          <Chip value="all">All · {items.length}</Chip>
          {platforms.map((p) => (
            <Chip key={p} value={p}>
              {PLATFORM_LABELS[p]} · {items.filter((i) => i.platformKey === p).length}
            </Chip>
          ))}
        </ToggleGroup>
      ) : null}

      <p className="sr-only" aria-live="polite">
        Showing {shown.length} video{shown.length === 1 ? "" : "s"}
      </p>

      {tours.length ? (
        <section aria-labelledby="full-tours" className="flex flex-col gap-6">
          <h2 id="full-tours" className="eyebrow">
            Full tours
          </h2>
          <ul className="grid gap-8 md:grid-cols-2">
            {tours.map((v, i) => (
              <li key={v.id} className={i === 0 && tours.length % 2 === 1 ? "md:col-span-2" : undefined}>
                <TourCard video={v} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {shorts.length ? (
        <section aria-labelledby="shorts" className="flex flex-col gap-6">
          <h2 id="shorts" className="eyebrow">
            Quick walk-throughs
          </h2>
          <ul className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {shorts.map((v) => (
              <li key={v.id}>
                <TourCard video={v} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function TourCard({ video: v }: { video: Item }) {
  return (
    <article className="flex flex-col gap-3">
      <ClickToLoadEmbed
        url={v.url}
        title={v.title ?? "Sparks Properties house tour"}
        thumbnail={v.thumbnail}
        orientation={v.portrait ? "portrait" : "landscape"}
        className="max-w-none"
      />
      <div className="flex flex-col gap-1">
        {v.title ? <h3 className="font-display text-lg leading-snug sm:text-xl">{v.title}</h3> : null}
        {v.listing ? (
          <Link href={v.listing.href} className="inline-flex w-fit items-center gap-1 text-accent text-sm underline-offset-4 hover:underline">
            View the listing <ArrowRightIcon className="size-3.5" />
          </Link>
        ) : null}
      </div>
    </article>
  );
}
