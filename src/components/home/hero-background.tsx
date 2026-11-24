"use client";

import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

type HeroBackgroundProps = {
  images: { src: string; alt: string }[];
  videoUrl?: string | null;
};

const SLIDE_MS = 7000;
const FADE_S = 1.6;

/**
 * Full-bleed hero background: staff-uploaded video (site_settings.hero_video_url)
 * or a slow Ken-Burns crossfade of featured property covers. Static first image
 * under reduced motion. The first image is the LCP element, so it's priority.
 */
export function HeroBackground({ images, videoUrl }: HeroBackgroundProps) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const first = images[0];

  useEffect(() => {
    if (reduce || videoUrl || images.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % images.length), SLIDE_MS);
    return () => window.clearInterval(id);
  }, [reduce, videoUrl, images.length]);

  if (!first && !videoUrl) {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_30%,var(--color-ink-3),var(--color-ink))]"
      />
    );
  }

  return (
    <div aria-hidden="true" className="absolute inset-0">
      {/* Static first slide: in the server HTML for a fast LCP, and the reduced-motion view. */}
      {first ? <Image src={first.src} alt="" fill priority sizes="100vw" className="object-cover" /> : null}

      {videoUrl && !reduce ? (
        <video
          className="absolute inset-0 size-full object-cover"
          src={videoUrl}
          poster={first?.src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : null}

      {!videoUrl && !reduce && first ? (
        <AnimatePresence>
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: FADE_S, ease: "easeInOut" }}
          >
            {/* CSS animation (compositor thread): restarts with each slide's new element. */}
            <div className="absolute inset-0 animate-ken-burns will-change-transform">
              <Image src={images[index].src} alt="" fill sizes="100vw" className="object-cover" />
            </div>
          </motion.div>
        </AnimatePresence>
      ) : null}
    </div>
  );
}
