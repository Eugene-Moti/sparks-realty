"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { LayoutGroup, motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useId, useState } from "react";
import { duration, easeOut } from "@/components/motion/easing";
import { useCurrency } from "@/components/providers/currency-provider";
import { type DateRangeValue, DateRangePicker } from "@/components/search/date-range-picker";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/helpers/classname-helper";
import { formatCompact, kesToUsd } from "@/lib/format";
import { listingTypeRoutes, propertyTypeOptions } from "@/lib/labels";
import type { ListingType } from "@/types/db";

/**
 * URL params shared with /buy, /rent, /short-stays (Phase 3 reads them with nuqs):
 * area, type, beds (minimum), maxPrice (KES), checkIn, checkOut (YYYY-MM-DD), guests.
 */
const TABS: { value: ListingType; label: string }[] = [
  { value: "sale", label: "Buy" },
  { value: "rent", label: "Rent" },
  { value: "short_stay", label: "Short Stays" },
];

const MAX_PRICES: Record<"sale" | "rent", number[]> = {
  sale: [10_000_000, 20_000_000, 35_000_000, 50_000_000, 75_000_000, 100_000_000, 150_000_000],
  rent: [50_000, 80_000, 120_000, 180_000, 250_000, 400_000, 600_000],
};

const BEDS = ["1", "2", "3", "4", "5"];

type HeroSearchProps = {
  areas: { slug: string; name: string }[];
};

export function HeroSearch({ areas }: HeroSearchProps) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { currency, usdRate } = useCurrency();
  const [tab, setTab] = useState<ListingType>("sale");
  const [dates, setDates] = useState<DateRangeValue>({ checkIn: null, checkOut: null });
  const id = useId();
  const action = listingTypeRoutes[tab];

  const priceLabel = (kes: number) =>
    currency === "KES" ? formatCompact(kes) : formatCompact(kesToUsd(kes, usdRate), "USD");

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(e.currentTarget)) {
      if (typeof value === "string" && value.trim()) params.set(key, value.trim());
    }
    const qs = params.toString();
    router.push(qs ? `${action}?${qs}` : action);
  }


  return (
    <div className="glass w-full max-w-5xl rounded-(--radius-card-lg) border border-ivory/15 bg-ink/45! p-2 shadow-lift">
      <LayoutGroup id="hero-tabs">
        <div role="tablist" aria-label="What are you looking for?" className="flex gap-1 p-1">
          {TABS.map((t) => {
            const active = t.value === tab;
            return (
              <button
                key={t.value}
                type="button"
                role="tab"
                id={`${id}-tab-${t.value}`}
                aria-selected={active}
                aria-controls={`${id}-panel`}
                onClick={() => setTab(t.value)}
                className={cn(
                  "relative rounded-full px-4 py-2 font-medium text-sm transition-colors duration-200 sm:px-5",
                  active ? "text-ink" : "text-ivory/75 hover:text-ivory",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="hero-tab-pill"
                    className="absolute inset-0 rounded-full bg-ivory"
                    transition={{ duration: reduce ? 0 : duration.slow, ease: easeOut }}
                  />
                ) : null}
                <span className="relative">{t.label}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      {/* The tabpanel role belongs on a wrapper; a <form> keeps its own form role. */}
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${tab}`}>
      <form
        action={action}
        method="get"
        onSubmit={onSubmit}
        className="grid grid-cols-2 gap-2 p-1 md:grid-cols-[1.2fr_1fr_0.8fr_1fr_auto]"
      >
        <HeroField label="Location" className="col-span-2 md:col-span-1">
          {(fid) => (
            <Select id={fid} name="area" placeholder="All areas" options={areas.map((a) => ({ value: a.slug, label: a.name }))} bare />
          )}
        </HeroField>

        {tab === "short_stay" ? (
          <>
            <HeroField label="Dates" className="col-span-2">
              {(fid) => <DateRangePicker id={fid} variant="hero" value={dates} onChange={setDates} />}
            </HeroField>
            {dates.checkIn && dates.checkOut ? (
              <>
                <input type="hidden" name="checkIn" value={dates.checkIn} />
                <input type="hidden" name="checkOut" value={dates.checkOut} />
              </>
            ) : null}
            <HeroField label="Guests" className="col-span-2 md:col-span-1">
              {(fid) => (
                <Select
                  id={fid}
                  name="guests"
                  placeholder="Any"
                  options={["1", "2", "3", "4", "5", "6", "8", "10"].map((g) => ({ value: g, label: `${g} guest${g === "1" ? "" : "s"}` }))}
                  bare
                />
              )}
            </HeroField>
          </>
        ) : (
          <>
            <HeroField label="Property type">
              {(fid) => <Select id={fid} name="type" placeholder="Any type" options={propertyTypeOptions} bare />}
            </HeroField>
            <HeroField label="Bedrooms">
              {(fid) => (
                <Select
                  id={fid}
                  name="beds"
                  placeholder="Any"
                  options={BEDS.map((b) => ({ value: b, label: `${b}+ bed${b === "1" ? "" : "s"}` }))}
                  bare
                />
              )}
            </HeroField>
            <HeroField label="Max price">
              {(fid) => (
                <Select
                  id={fid}
                  name="maxPrice"
                  placeholder="No max"
                  options={MAX_PRICES[tab].map((v) => ({
                    value: String(v),
                    label: `${priceLabel(v)}${tab === "rent" ? "/mo" : ""}`,
                  }))}
                  bare
                />
              )}
            </HeroField>
          </>
        )}

        <Button type="submit" size="lg" className="col-span-2 h-auto min-h-14 rounded-2xl md:col-span-1 md:px-8">
          <MagnifyingGlassIcon weight="bold" />
          Search
        </Button>
      </form>
      </div>
    </div>
  );
}

function HeroField({
  label,
  children,
  className,
}: {
  label: string;
  children: (id: string) => ReactNode;
  className?: string;
}) {
  const fid = useId();
  return (
    <div className={cn("flex flex-col justify-center rounded-2xl bg-ivory/6 px-4 pt-2.5 pb-1 transition-colors focus-within:bg-ivory/10 hover:bg-ivory/9", className)}>
      <label htmlFor={fid} className="font-medium text-[0.65rem] text-gold-200/90 uppercase tracking-[0.2em]">
        {label}
      </label>
      {children(fid)}
    </div>
  );
}


