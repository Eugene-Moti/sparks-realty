"use client";

import { CubeIcon, MapTrifoldIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/helpers/classname-helper";

/** Friendly provider name from a URL ("my.matterport.com" → "Matterport"). */
function providerName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\.|^my\./, "");
    const known: Record<string, string> = {
      "matterport.com": "Matterport",
      "kuula.co": "Kuula",
      "cloudpano.com": "CloudPano",
      "momento360.com": "Momento360",
      "youtube.com": "YouTube",
      "google.com": "Google Maps",
    };
    return known[host] ?? host;
  } catch {
    return "an external site";
  }
}

/**
 * Click-to-load wrapper for any third-party iframe that isn't a video
 * platform (Matterport / Kuula 3D tours, the Google Maps office map). Same privacy rule as
 * ClickToLoadEmbed: nothing is requested from the provider until the visitor clicks.
 */
export function ClickToLoadFrame({
  url,
  title,
  poster,
  className,
  kind = "tour",
}: {
  url: string;
  title: string;
  /** Our own image (e.g. the listing cover photo). */
  poster?: string | null;
  className?: string;
  /** "tour" (3D tour, the default) or "map" (a Google Maps embed). */
  kind?: "tour" | "map";
}) {
  const [loaded, setLoaded] = useState(false);
  const provider = providerName(url);
  const frameClass = cn(
    "relative isolate aspect-video w-full overflow-hidden rounded-(--radius-card) border border-hairline bg-ink text-ivory",
    className,
  );

  if (loaded) {
    return (
      <div className={frameClass}>
        <iframe
          src={url}
          title={title}
          className="absolute inset-0 size-full"
          allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <div className={cn(frameClass, "group grain")}>
      {poster ? (
        <Image src={poster} alt="" fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover opacity-60 transition-opacity duration-500 group-hover:opacity-75" />
      ) : null}
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-ink/85 via-ink/30 to-ink/10" />
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1 p-4 sm:p-5">
        <p className="font-display text-lg sm:text-xl">{title}</p>
        <p className="text-[0.7rem] text-ivory/65">
          Loads from {provider} when you press start — see our{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
      <button
        type="button"
        onClick={() => setLoaded(true)}
        className="absolute inset-0 z-20 grid cursor-pointer place-items-center"
        aria-label={`${kind === "map" ? "Load the map" : "Start the 3D tour"}: ${title} (loads from ${provider})`}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-ink/55 px-5 py-3 font-medium text-gold text-sm backdrop-blur-md transition-[transform,border-color] duration-300 group-hover:scale-105 group-hover:border-gold">
          {kind === "map" ? (
            <>
              <MapTrifoldIcon className="size-5" /> Show map
            </>
          ) : (
            <>
              <CubeIcon className="size-5" /> Start 3D tour
            </>
          )}
        </span>
      </button>
    </div>
  );
}
