"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { motion, type PanInfo } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { useState } from "react";
import { easeOut } from "@/components/motion/easing";
import { cn } from "@/helpers/classname-helper";
import type { PropertyCardData } from "@/lib/queries/properties";
import { PropertyCard } from "./property-card";

/** How many cards are visibly fanned behind the top one. */
const VISIBLE = 3;
const SWIPE_DISTANCE = 90;
const SWIPE_VELOCITY = 500;

/**
 * Mobile "hand of cards": listings fanned like playing cards; swipe (or use the
 * buttons) to send the top card to the back. Under reduced motion it becomes a
 * plain horizontal scroll-snap row.
 */
export function CardHand({ properties, className }: { properties: PropertyCardData[]; className?: string }) {
  const reduce = useReducedMotion();
  const [order, setOrder] = useState(() => properties.map((_, i) => i));
  const [exitDir, setExitDir] = useState<1 | -1>(1);
  // Reset the order when the set of properties changes (e.g. area tab switch).
  const key = properties.map((p) => p.id).join(",");
  const [lastKey, setLastKey] = useState(key);
  const changed = key !== lastKey;
  if (changed) {
    setLastKey(key);
    setOrder(properties.map((_, i) => i));
  }
  // This render still sees the previous order; use the fresh one so indices never point past
  // the new (possibly shorter) list.
  const current = changed ? properties.map((_, i) => i) : order;

  if (properties.length === 0) return null;

  if (reduce) {
    return (
      <div className={cn("-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-none", className)}>
        {properties.map((p) => (
          <PropertyCard key={p.id} property={p} sharedTransition={false} className="w-[85vw] max-w-sm shrink-0 snap-center" />
        ))}
      </div>
    );
  }

  const cycle = (dir: 1 | -1) => {
    setExitDir(dir);
    setOrder((o) => (dir === 1 ? [...o.slice(1), o[0]] : [o[o.length - 1], ...o.slice(0, -1)]));
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > SWIPE_DISTANCE || Math.abs(info.velocity.x) > SWIPE_VELOCITY) {
      cycle(info.offset.x < 0 ? 1 : -1);
    }
  };

  const top = properties[current[0]];

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      <div
        className="relative mx-auto w-full max-w-sm"
        role="region"
        aria-roledescription="card stack"
        aria-label="Featured homes"
      >
        {/* Invisible copy of the top card sizes the stack. */}
        <div aria-hidden="true" className="invisible" inert>
          <PropertyCard property={top} carousel={false} sharedTransition={false} />
        </div>
        {current
          .slice(0, VISIBLE + 1)
          .map((propertyIndex, depth) => {
            const p = properties[propertyIndex];
            const isTop = depth === 0;
            const hidden = depth === VISIBLE;
            return (
              <motion.div
                key={p.id}
                className="absolute inset-0 origin-bottom"
                style={{ zIndex: VISIBLE + 1 - depth }}
                initial={false}
                animate={{
                  rotate: hidden ? 0 : depth * (depth % 2 ? -3.5 : 3),
                  x: hidden ? 0 : depth * (depth % 2 ? -10 : 10),
                  y: depth * 10,
                  scale: 1 - depth * 0.04,
                  opacity: hidden ? 0 : 1,
                }}
                transition={{ duration: 0.45, ease: easeOut }}
                drag={isTop ? "x" : false}
                dragSnapToOrigin
                dragElastic={0.6}
                onDragEnd={isTop ? onDragEnd : undefined}
                whileDrag={{ rotate: exitDir * 2, cursor: "grabbing" }}
                aria-hidden={isTop ? undefined : true}
                inert={!isTop}
              >
                <PropertyCard
                  sharedTransition={false}
                  property={p}
                  carousel={false}
                  sizes="(max-width: 640px) 92vw, 384px"
                  className={cn("h-full", !isTop && "pointer-events-none")}
                />
              </motion.div>
            );
          })}
      </div>

      {properties.length > 1 ? (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => cycle(-1)}
            aria-label="Previous home"
            className="grid size-11 place-items-center rounded-full border border-hairline transition-colors hover:border-gold hover:text-accent"
          >
            <ArrowLeftIcon className="size-5" />
          </button>
          <p className="min-w-16 text-center font-mono text-muted text-xs" aria-live="polite">
            {String((current[0] ?? 0) + 1).padStart(2, "0")} / {String(properties.length).padStart(2, "0")}
          </p>
          <button
            type="button"
            onClick={() => cycle(1)}
            aria-label="Next home"
            className="grid size-11 place-items-center rounded-full border border-hairline transition-colors hover:border-gold hover:text-accent"
          >
            <ArrowRightIcon className="size-5" />
          </button>
        </div>
      ) : null}
      <p className="sr-only">Swipe the top card left or right, or use the arrow buttons, to see more homes.</p>
    </div>
  );
}
