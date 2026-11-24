"use client";

import { ArrowRightIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import Link from "next/link";
import { useState } from "react";
import { duration, easeOut } from "@/components/motion/easing";
import { CardHand } from "@/components/property/card-hand";
import { PropertyCard } from "@/components/property/property-card";
import { useContact } from "@/components/providers/contact-provider";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/helpers/classname-helper";
import { whatsappLink } from "@/lib/format";
import type { PropertyCardData } from "@/lib/queries/properties";

type FeaturedListingsProps = {
  listings: PropertyCardData[];
  tabs: { slug: string; name: string }[];
};

const GRID_MAX = 6;
const HAND_MAX = 8;

export function FeaturedListings({ listings, tabs }: FeaturedListingsProps) {
  const reduce = useReducedMotion();
  const { whatsapp } = useContact();
  const [area, setArea] = useState<string>("all");
  // Layout animations only after the first tab change (no measuring every card on load).
  const [changed, setChanged] = useState(false);

  const filtered = area === "all" ? listings : listings.filter((l) => l.areaSlug === area);
  const areaName = tabs.find((t) => t.slug === area)?.name;
  const viewAllHref = area === "all" ? "/properties" : `/properties?area=${area}`;

  return (
    <section id="featured" aria-labelledby="featured-title" className="mx-auto w-full max-w-[90rem] scroll-mt-24 px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
      <SectionHeading
        id="featured-title"
        eyebrow="Featured listings"
        title="Homes worth coming home to"
        description="Hand-picked across Nairobi's most liveable neighbourhoods — each one visited, photographed and checked by our team."
        action={
          <Button asChild variant="gold-outline">
            <Link href={viewAllHref}>
              View all properties <ArrowRightIcon />
            </Link>
          </Button>
        }
      />

      <LayoutGroup id="featured-tabs">
        <div
          role="tablist"
          aria-label="Filter by area"
          className="-mx-4 mt-12 flex gap-1 overflow-x-auto border-hairline border-b px-4 scrollbar-none sm:mx-0 sm:px-0"
        >
          {[{ slug: "all", name: "All" }, ...tabs].map((t) => {
            const active = t.slug === area;
            return (
              <button
                key={t.slug}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setArea(t.slug);
                  setChanged(true);
                }}
                className={cn(
                  "relative shrink-0 px-4 pt-2 pb-3.5 font-medium text-sm transition-colors duration-200",
                  active ? "text-accent" : "text-muted hover:text-foreground",
                )}
              >
                {t.name}
                {active ? (
                  <motion.span
                    layoutId="featured-tab-underline"
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gold-600 dark:bg-gold"
                    transition={{ duration: reduce ? 0 : duration.slow, ease: easeOut }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <div className="mt-10" role="tabpanel" aria-live="polite">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-5 rounded-(--radius-card-lg) border border-hairline border-dashed px-6 py-16 text-center">
            <p className="font-display text-2xl">
              {area === "all" ? "New listings are on their way" : `Nothing listed in ${areaName ?? "this area"} right now`}
            </p>
            <p className="max-w-md text-muted text-sm">
              We often hear about homes before they reach the market. Tell us what you&apos;re after and we&apos;ll call you first.
            </p>
            <Button asChild>
              <a
                href={whatsappLink(`Hi Sparks Properties, I'm looking for a home in ${areaName ?? "Nairobi"}.`, whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsappLogoIcon weight="fill" /> Ask on WhatsApp
              </a>
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop / tablet: grid with layout animation on tab change */}
            <motion.ul layout={!reduce && changed} className="hidden gap-6 md:grid md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout" initial={false}>
                {filtered.slice(0, GRID_MAX).map((p, i) => (
                  <motion.li
                    key={p.id}
                    layout={!reduce && changed}
                    initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4, ease: easeOut, delay: reduce ? 0 : i * 0.04 }}
                    className="h-full"
                  >
                    <PropertyCard property={p} className="h-full" />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>

            {/* Phones: fanned hand of cards */}
            <CardHand properties={filtered.slice(0, HAND_MAX)} className="md:hidden" />
          </>
        )}
      </div>
    </section>
  );
}
