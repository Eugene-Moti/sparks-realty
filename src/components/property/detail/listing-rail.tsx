"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useRef } from "react";
import { PropertyCard } from "@/components/property/property-card";
import { Button } from "@/components/ui/button";
import type { PropertyCardData } from "@/lib/queries/properties";

/** Horizontal, snap-scrolling row of property cards with arrow buttons on desktop. */
export function ListingRail({
  id,
  eyebrow,
  title,
  items,
  sharedTransition = true,
}: {
  id: string;
  eyebrow: string;
  title: string;
  items: PropertyCardData[];
  /** Off for rails that may repeat a card shown elsewhere on the page. */
  sharedTransition?: boolean;
}) {
  const ref = useRef<HTMLUListElement>(null);
  if (!items.length) return null;

  const scroll = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3 text-accent">{eyebrow}</p>
          <h2 id={`${id}-title`} className="font-display text-[2rem] leading-tight">
            {title}
          </h2>
        </div>
        {items.length > 2 ? (
          <div className="hidden gap-2 md:flex">
            <Button variant="gold-outline" size="icon" onClick={() => scroll(-1)} aria-label={`Scroll ${title} back`}>
              <CaretLeftIcon />
            </Button>
            <Button variant="gold-outline" size="icon" onClick={() => scroll(1)} aria-label={`Scroll ${title} forward`}>
              <CaretRightIcon />
            </Button>
          </div>
        ) : null}
      </div>
      <ul
        ref={ref}
        className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-4 scrollbar-none sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0"
      >
        {items.map((p) => (
          <li key={p.id} className="w-[82vw] max-w-sm shrink-0 snap-start sm:w-[22rem]">
            <PropertyCard property={p} sharedTransition={sharedTransition} className="h-full" sizes="352px" />
          </li>
        ))}
      </ul>
    </section>
  );
}
