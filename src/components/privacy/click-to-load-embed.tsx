"use client";

import { ArrowUpRightIcon, PlayIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/helpers/classname-helper";
import {
  embedUrlFor,
  type ParsedVideo,
  parseVideoUrl,
  platformLabel,
  youTubeThumbnail,
} from "@/lib/embeds";

type ClickToLoadEmbedProps = {
  /** Any YouTube / TikTok / Instagram / Facebook URL as pasted by staff. */
  url: string;
  title: string;
  /** Optional custom thumbnail (e.g. videos.thumbnail or a property photo). */
  thumbnail?: string | null;
  className?: string;
  /** Use "portrait" for Shorts, TikTok and Reels. Auto-detected when omitted. */
  orientation?: "landscape" | "portrait";
  /**
   * Start playing immediately. Only for embeds the visitor has just asked for
   * with a click (e.g. a video modal opened from a "Video tour" button).
   */
  autoLoad?: boolean;
};

/**
 * Privacy-first video embed. Shows a branded poster; the third-party iframe is
 * only created after the visitor clicks play, so YouTube/TikTok/Instagram get
 * no request (or cookies) before that. YouTube posters are fetched through
 * next/image on our own domain, and playback uses youtube-nocookie.com.
 */
export function ClickToLoadEmbed({
  url,
  title,
  thumbnail,
  className,
  orientation,
  autoLoad = false,
}: ClickToLoadEmbedProps) {
  const [loaded, setLoaded] = useState(autoLoad);
  const video = parseVideoUrl(url);

  if (!video) return null;

  const portrait =
    orientation === "portrait" ||
    (!orientation &&
      (video.platform === "tiktok" ||
        video.platform === "instagram" ||
        (video.platform === "youtube" && video.isShort)));

  const poster = thumbnail ?? (video.platform === "youtube" ? youTubeThumbnail(video.id) : null);
  const label = platformLabel[video.platform];
  const src = embedUrlFor(video);

  const frameClass = cn(
    "relative isolate w-full overflow-hidden rounded-(--radius-card) border border-hairline bg-ink text-ivory",
    portrait ? "aspect-9/16 max-w-sm" : "aspect-video",
    className,
  );

  if (loaded && src) {
    return (
      <div className={frameClass}>
        <iframe
          src={src}
          title={title}
          className="absolute inset-0 size-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <div className={cn(frameClass, "group grain")}>
      {poster ? (
        <Image
          src={poster}
          alt=""
          fill
          sizes={portrait ? "384px" : "(min-width: 1024px) 60vw, 100vw"}
          className="object-cover opacity-80 transition-[opacity,transform] duration-700 ease-(--ease-out-brand) group-hover:scale-[1.03] group-hover:opacity-90"
        />
      ) : (
        <PosterFallback video={video} />
      )}
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-ink/85 via-ink/20 to-ink/10" />

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1 p-4 sm:p-5">
        <p className="line-clamp-2 font-display text-lg leading-tight sm:text-xl">{title}</p>
        <p className="text-[0.7rem] text-ivory/65 leading-snug">
          {src ? (
            <>
              Plays from {label}. Pressing play connects to {label} — see our{" "}
              <Link href="/privacy" className="underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </>
          ) : (
            <>Opens on {label} in a new tab.</>
          )}
        </p>
      </div>

      {src ? (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="absolute inset-0 z-20 grid cursor-pointer place-items-center"
          aria-label={`Play video: ${title} (loads from ${label})`}
        >
          <span className="grid size-16 place-items-center rounded-full border border-gold/50 bg-ink/50 backdrop-blur-md transition-[transform,background-color,border-color] duration-300 ease-(--ease-out-brand) group-hover:scale-105 group-hover:border-gold group-hover:bg-ink/70">
            <PlayIcon weight="fill" className="ml-1 size-6 text-gold" />
          </span>
        </button>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-20 grid place-items-center"
          aria-label={`Watch on ${label}: ${title} (opens in a new tab)`}
        >
          <span className="grid size-16 place-items-center rounded-full border border-gold/50 bg-ink/50 backdrop-blur-md">
            <ArrowUpRightIcon weight="bold" className="size-6 text-gold" />
          </span>
        </a>
      )}
    </div>
  );
}

function PosterFallback({ video }: { video: ParsedVideo }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(ellipse_at_top,var(--color-ink-3),var(--color-ink))]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/mark.svg" alt="" className="size-24 opacity-25" />
      <span className="sr-only">{platformLabel[video.platform]} video</span>
    </div>
  );
}
