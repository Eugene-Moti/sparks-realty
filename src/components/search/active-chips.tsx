"use client";

import { XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { useCurrency } from "@/components/providers/currency-provider";
import { formatCompact, kesToUsd } from "@/lib/format";
import { furnishingLabels, listingTypeLabels, propertyTypeLabels } from "@/lib/labels";
import { amenityLabel, type FixedFilters } from "@/lib/search/filters";
import { emptySearchState, type SearchParamsState } from "@/lib/search/params";
import type { Furnishing, PropertyType } from "@/types/db";
import type { FilterPatch } from "./filter-controls";
import { formatShortDate } from "@/lib/dates";

type Chip = { key: string; label: string; patch: FilterPatch };

/** Removable chips for every active filter, plus "Clear all". */
export function ActiveChips({
  value,
  fixed,
  areaNames,
  onChange,
}: {
  value: SearchParamsState;
  fixed: FixedFilters;
  areaNames: Record<string, string>;
  onChange: (patch: FilterPatch) => void;
}) {
  const reduce = useReducedMotion();
  const { currency, usdRate } = useCurrency();
  const money = (kes: number) =>
    currency === "KES" ? formatCompact(kes) : formatCompact(kesToUsd(kes, usdRate), "USD");

  const chips: Chip[] = [];
  if (value.q) chips.push({ key: "q", label: `“${value.q}”`, patch: { q: null } });
  if (value.listing && !fixed.listing)
    chips.push({ key: "listing", label: listingTypeLabels[value.listing], patch: { listing: null, minPrice: null, maxPrice: null } });
  if (!fixed.area)
    for (const a of value.area)
      chips.push({ key: `area-${a}`, label: areaNames[a] ?? a, patch: { area: value.area.filter((x) => x !== a) } });
  for (const t of value.type)
    chips.push({
      key: `type-${t}`,
      label: propertyTypeLabels[t as PropertyType] ?? t,
      patch: { type: value.type.filter((x) => x !== t) },
    });
  if (value.minPrice) chips.push({ key: "min", label: `From ${money(value.minPrice)}`, patch: { minPrice: null } });
  if (value.maxPrice) chips.push({ key: "max", label: `Up to ${money(value.maxPrice)}`, patch: { maxPrice: null } });
  if (value.beds) chips.push({ key: "beds", label: `${value.beds}+ beds`, patch: { beds: null } });
  if (value.baths) chips.push({ key: "baths", label: `${value.baths}+ baths`, patch: { baths: null } });
  for (const f of value.furnishing)
    chips.push({
      key: `furn-${f}`,
      label: furnishingLabels[f as Furnishing],
      patch: { furnishing: value.furnishing.filter((x) => x !== f) },
    });
  for (const a of value.amenities)
    chips.push({ key: `am-${a}`, label: amenityLabel(a), patch: { amenities: value.amenities.filter((x) => x !== a) } });
  if (value.available) chips.push({ key: "avail", label: `Available by ${value.available}`, patch: { available: null } });
  if (value.checkIn && value.checkOut)
    chips.push({ key: "dates", label: `${formatShortDate(value.checkIn)} → ${formatShortDate(value.checkOut)}`, patch: { checkIn: null, checkOut: null } });
  if (value.guests) chips.push({ key: "guests", label: `${value.guests}+ guests`, patch: { guests: null } });

  if (chips.length === 0) return null;

  const clearAll: FilterPatch = { ...emptySearchState, sort: value.sort, view: value.view };

  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      <AnimatePresence mode="popLayout" initial={false}>
        {chips.map((c) => (
          <motion.li
            key={c.key}
            layout={!reduce}
            initial={reduce ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              onClick={() => onChange(c.patch)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-gold-600/40 bg-gold-400/10 pr-2 pl-3 font-medium text-accent text-xs transition-colors hover:border-gold-600 dark:border-gold/40"
              aria-label={`Remove filter: ${c.label}`}
            >
              {c.label}
              <XIcon aria-hidden="true" className="size-3.5" />
            </button>
          </motion.li>
        ))}
        <motion.li key="clear" layout={!reduce}>
          <button
            type="button"
            onClick={() => onChange(clearAll)}
            className="h-8 px-2 font-medium text-muted text-xs underline-offset-4 hover:text-foreground hover:underline"
          >
            Clear all
          </button>
        </motion.li>
      </AnimatePresence>
    </ul>
  );
}
