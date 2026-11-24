"use client";

import { FilmStripIcon, ImagesIcon, PlayIcon, SquareHalfIcon } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { type ReactNode, useRef, useState } from "react";
import { PhotoTransition, photoTransitionName } from "@/components/property/property-card";
import { cn } from "@/helpers/classname-helper";
import type { ImageData } from "@/lib/media";

const GalleryLightbox = dynamic(() => import("./gallery-lightbox"), { ssr: false });

type GalleryProps = {
  propertyId: string;
  title: string;
  images: ImageData[];
  hasVideo: boolean;
  hasFloorPlan: boolean;
  /** "Sold" / "Let" / "Under offer" overlay. */
  ribbon?: string;
  /** Badges over the main photo (top-left). */
  badges?: ReactNode;
};

/** Bento slot classes (md+) for the first five photos, by how many there are. */
function bentoClass(i: number, n: number): string {
  if (n === 1) return "md:col-span-4 md:row-span-2";
  if (n === 2) return "md:col-span-2 md:row-span-2";
  if (n === 3) return i === 0 ? "md:col-span-2 md:row-span-2" : "md:col-span-2";
  if (n === 4) return i === 0 ? "md:col-span-2 md:row-span-2" : i === 1 ? "md:col-span-2" : "";
  return i === 0 ? "md:col-span-2 md:row-span-2" : i < 5 ? "" : "md:hidden";
}

/**
 * Listing hero gallery. One list of photos that is a swipeable strip on phones
 * and a 1 + 4 bento grid from md up, so the cover photo is a single element the
 * card image can morph into. Opens a fullscreen lightbox with room filters.
 */
export function Gallery({ propertyId, title, images, hasVideo, hasFloorPlan, ribbon, badges }: GalleryProps) {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const stripRef = useRef<HTMLUListElement>(null);
  const n = images.length;

  const openAt = (i: number) => {
    setStartIndex(i);
    setEverOpened(true);
    setOpen(true);
  };

  const onStripScroll = () => {
    const el = stripRef.current;
    if (!el || el.clientWidth === 0) return;
    setMobileIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (n === 0) {
    return (
      <div className="relative -mx-4 grid aspect-4/3 place-items-center bg-ink-3 sm:mx-0 sm:rounded-(--radius-card-lg) md:aspect-[2.4/1]">
        <PhotoTransition name={photoTransitionName(propertyId)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mark.svg" alt="" className="size-24 opacity-25" />
        </PhotoTransition>
        <p className="absolute bottom-4 text-ivory/60 text-sm">Photos coming soon</p>
      </div>
    );
  }

  return (
    <div className="relative -mx-4 sm:mx-0">
      <ul
        ref={stripRef}
        onScroll={onStripScroll}
        aria-label={`Photos of ${title}`}
        className={cn(
          "flex snap-x snap-mandatory overflow-x-auto scrollbar-none",
          "md:grid md:h-[min(66vh,38rem)] md:grid-cols-4 md:grid-rows-2 md:gap-2 md:overflow-hidden md:rounded-(--radius-card-lg)",
        )}
      >
        {images.map((img, i) => (
          <li
            key={img.src + i}
            className={cn(
              "relative aspect-4/3 w-full shrink-0 snap-center overflow-hidden bg-ink-3 md:aspect-auto md:w-auto",
              bentoClass(i, n),
            )}
          >
            <button
              type="button"
              onClick={() => openAt(i)}
              className="group/photo absolute inset-0 cursor-zoom-in"
              aria-label={`Open photo ${i + 1} of ${n}${img.room ? ` (${img.room})` : ""}`}
            >
              {i === 0 ? (
                <PhotoTransition name={photoTransitionName(propertyId)}>
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    priority
                    sizes="(min-width: 768px) 50vw, 100vw"
                    placeholder={img.blurDataURL ? "blur" : "empty"}
                    blurDataURL={img.blurDataURL ?? undefined}
                    className="object-cover transition-transform duration-700 ease-(--ease-out-brand) md:group-hover/photo:scale-[1.03]"
                  />
                </PhotoTransition>
              ) : (
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 768px) 25vw, 100vw"
                  placeholder={img.blurDataURL ? "blur" : "empty"}
                  blurDataURL={img.blurDataURL ?? undefined}
                  className="object-cover transition-transform duration-700 ease-(--ease-out-brand) md:group-hover/photo:scale-[1.03]"
                />
              )}
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-ink/0 transition-colors duration-300 md:group-hover/photo:bg-ink/10"
              />
            </button>
          </li>
        ))}
      </ul>

      {/* Overlays */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-b from-ink/30 via-transparent to-ink/35 md:rounded-(--radius-card-lg) md:bg-none" />
      {badges ? <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-1.5 sm:top-4 sm:left-4">{badges}</div> : null}
      {ribbon ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 bg-ink/75 py-3 text-center font-medium text-ivory text-sm uppercase tracking-[0.4em] backdrop-blur-sm md:inset-x-auto md:top-6 md:right-6 md:translate-y-0 md:rounded-full md:px-6 md:py-2 md:text-xs">
          {ribbon}
        </div>
      ) : null}

      <div className="absolute right-3 bottom-3 flex flex-wrap justify-end gap-2 sm:right-4 sm:bottom-4">
        <span className="pointer-events-none inline-flex h-9 items-center rounded-full bg-ink/60 px-3 font-mono text-ivory text-xs backdrop-blur-md md:hidden">
          {Math.min(mobileIndex + 1, n)} / {n}
        </span>
        {hasVideo ? (
          <OverlayLink href="#tour" icon={<PlayIcon weight="fill" />}>
            Video tour
          </OverlayLink>
        ) : null}
        {hasFloorPlan ? (
          <OverlayLink href="#floor-plan" icon={<SquareHalfIcon />} className="hidden sm:inline-flex">
            Floor plan
          </OverlayLink>
        ) : null}
        <button
          type="button"
          onClick={() => openAt(0)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ivory px-4 font-medium text-ink text-sm shadow-soft transition-transform hover:scale-[1.03] active:scale-[0.98] [&_svg]:size-4"
        >
          {n > 1 ? <ImagesIcon /> : <FilmStripIcon />}
          <span className="hidden sm:inline">View all {n} photos</span>
          <span className="sm:hidden">All photos</span>
        </button>
      </div>

      {everOpened ? (
        <GalleryLightbox images={images} open={open} index={startIndex} onClose={() => setOpen(false)} title={title} />
      ) : null}
    </div>
  );
}

function OverlayLink({
  href,
  icon,
  children,
  className,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full bg-ink/60 px-3.5 font-medium text-ivory text-sm backdrop-blur-md transition-colors hover:bg-ink/80 [&_svg]:size-4 [&_svg]:text-gold",
        className,
      )}
    >
      {icon}
      {children}
    </a>
  );
}
