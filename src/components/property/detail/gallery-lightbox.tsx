"use client";

import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { useState } from "react";
import Lightbox, { type SlideImage } from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { cn } from "@/helpers/classname-helper";
import { LIGHTBOX_WIDTHS, optimizedImageUrl } from "@/lib/image-url";
import type { ImageData } from "@/lib/media";
import { ROOM_GROUPS, type RoomGroup, roomGroup } from "./rooms";

type GalleryLightboxProps = {
  images: ImageData[];
  open: boolean;
  /** Index (into `images`) to open at. */
  index: number;
  onClose: () => void;
  title: string;
};

function toSlide(img: ImageData): SlideImage {
  const widths = LIGHTBOX_WIDTHS.filter((w) => w <= img.width * 1.1);
  const ratio = img.height / img.width;
  return {
    src: optimizedImageUrl(img.src, 1200),
    alt: img.alt,
    width: img.width,
    height: img.height,
    srcSet: (widths.length ? widths : [LIGHTBOX_WIDTHS[0]]).map((w) => ({
      src: optimizedImageUrl(img.src, w),
      width: w,
      height: Math.round(w * ratio),
    })),
  };
}

/**
 * Fullscreen photo viewer: swipe, keyboard arrows, pinch/scroll zoom,
 * thumbnails, and room filter chips (Living, Kitchen, Bedrooms…).
 * Loaded on demand the first time a photo is opened.
 */
export default function GalleryLightbox({ images, open, index, onClose, title }: GalleryLightboxProps) {
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState<RoomGroup | "All">("All");
  const [current, setCurrent] = useState(index);
  const [wasOpen, setWasOpen] = useState(open);

  // Each time the viewer opens, start from the clicked photo with no filter.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setFilter("All");
      setCurrent(index);
    }
  }

  const groups = ROOM_GROUPS.filter((g) => images.some((img) => roomGroup(img.room) === g));
  const visible = filter === "All" ? images : images.filter((img) => roomGroup(img.room) === filter);
  const slides = visible.map(toSlide);
  const active = visible[Math.min(current, visible.length - 1)];

  const choose = (g: RoomGroup | "All") => {
    setFilter(g);
    setCurrent(0);
  };

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={Math.min(current, Math.max(slides.length - 1, 0))}
      slides={slides}
      plugins={[Thumbnails, Zoom]}
      className="sp-lightbox"
      on={{ view: ({ index: i }) => setCurrent(i) }}
      carousel={{ finite: slides.length <= 1, preload: 2, padding: "16px", spacing: "8%" }}
      animation={reduce ? { fade: 0, swipe: 0, navigation: 0 } : { fade: 250, swipe: 400 }}
      controller={{ closeOnBackdropClick: true }}
      zoom={{ maxZoomPixelRatio: 2, scrollToZoom: true }}
      thumbnails={{
        width: 96,
        height: 64,
        border: 1,
        borderRadius: 10,
        padding: 0,
        gap: 8,
        imageFit: "cover",
        vignette: false,
        showToggle: true,
      }}
      labels={{
        Lightbox: `Photos of ${title}`,
        Carousel: "Photos",
        Slide: "Photo",
        Previous: "Previous photo",
        Next: "Next photo",
        Close: "Close photos",
      }}
      render={{
        controls: () => (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 p-3 pr-28 sm:p-4 sm:pr-36">
            {groups.length > 1 ? (
              <div
                role="toolbar"
                aria-label="Filter photos by room"
                className="pointer-events-auto flex gap-2 overflow-x-auto scrollbar-none"
              >
                {(["All", ...groups] as const).map((g) => {
                  const count = g === "All" ? images.length : images.filter((img) => roomGroup(img.room) === g).length;
                  return (
                    <button
                      key={g}
                      type="button"
                      aria-pressed={filter === g}
                      onClick={() => choose(g)}
                      className={cn(
                        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 font-medium text-sm backdrop-blur-md transition-colors",
                        filter === g
                          ? "border-gold/70 bg-ink/85 text-gold"
                          : "border-ivory/15 bg-ink/65 text-ivory/85 hover:border-ivory/40 hover:text-ivory",
                      )}
                    >
                      {g}
                      <span className="font-mono text-[0.7rem] opacity-60">{count}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
            <p className="self-start rounded-full bg-ink/65 px-2.5 py-1 font-mono text-ivory/80 text-xs backdrop-blur-md" aria-live="polite">
              {visible.length ? `${Math.min(current, visible.length - 1) + 1} / ${visible.length}` : ""}
              {active?.room ? <span className="ml-2 font-sans text-ivory/55">{active.room}</span> : null}
            </p>
          </div>
        ),
      }}
    />
  );
}
