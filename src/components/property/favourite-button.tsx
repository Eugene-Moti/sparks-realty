"use client";

import { HeartIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { useState } from "react";
import { easeOut } from "@/components/motion/easing";
import { cn } from "@/helpers/classname-helper";
import { useFavourites } from "@/lib/stores/favourites";

const PARTICLES = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

/** Heart toggle with a small burst when a home is saved. Stored on the device only. */
export function FavouriteButton({
  id,
  title,
  className,
}: {
  id: string;
  title: string;
  className?: string;
}) {
  const { has, toggle } = useFavourites();
  const reduce = useReducedMotion();
  const [burst, setBurst] = useState(0);
  const active = has(id);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${title} from favourites` : `Save ${title} to favourites`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!active) setBurst((b) => b + 1);
        toggle(id);
      }}
      className={cn(
        "relative grid size-10 place-items-center rounded-full bg-ink/45 text-ivory backdrop-blur-md transition-colors duration-200 hover:bg-ink/65",
        className,
      )}
    >
      <motion.span
        key={active ? `on-${burst}` : "off"}
        initial={reduce || !active ? false : { scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
        className="grid place-items-center"
      >
        <HeartIcon weight={active ? "fill" : "regular"} className={cn("size-5", active && "text-[#ff5d6c]")} />
      </motion.span>
      <AnimatePresence>
        {burst > 0 && active && !reduce ? (
          <span key={burst} aria-hidden="true" className="pointer-events-none absolute inset-0">
            {PARTICLES.map((angle) => (
              <motion.span
                key={angle}
                className="absolute top-1/2 left-1/2 size-1.5 rounded-full bg-gold-200"
                initial={{ x: "-50%", y: "-50%", opacity: 1, scale: 1 }}
                animate={{
                  x: `calc(-50% + ${Math.cos(angle) * 20}px)`,
                  y: `calc(-50% + ${Math.sin(angle) * 20}px)`,
                  opacity: 0,
                  scale: 0.4,
                }}
                transition={{ duration: 0.55, ease: easeOut }}
              />
            ))}
          </span>
        ) : null}
      </AnimatePresence>
    </button>
  );
}
