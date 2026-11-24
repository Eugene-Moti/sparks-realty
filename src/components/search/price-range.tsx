"use client";

import { Slider } from "radix-ui";
import { useState } from "react";
import { useCurrency } from "@/components/providers/currency-provider";
import { formatCompact, kesToUsd } from "@/lib/format";
import { PRICE_STEPS } from "@/lib/search/filters";
import type { ListingType } from "@/types/db";

type PriceRangeProps = {
  listing: ListingType;
  min: number | null;
  max: number | null;
  onCommit: (range: { minPrice: number | null; maxPrice: number | null }) => void;
};

function nearestIndex(steps: number[], value: number | null, fallback: number) {
  if (value === null) return fallback;
  let best = 0;
  for (let i = 0; i < steps.length; i++) if (Math.abs(steps[i] - value) < Math.abs(steps[best] - value)) best = i;
  return best;
}

/**
 * Two-thumb price slider over sensible KES steps for the listing type
 * (sale / monthly rent / nightly). Labels follow the KES/USD toggle; the URL
 * always stores KES. Commits on release so the results don't thrash.
 */
export function PriceRange({ listing, min, max, onCommit }: PriceRangeProps) {
  const { currency, usdRate } = useCurrency();
  const steps = PRICE_STEPS[listing];
  const last = steps.length - 1;
  const committed: [number, number] = [nearestIndex(steps, min, 0), nearestIndex(steps, max, last)];
  const [draft, setDraft] = useState<[number, number] | null>(null);
  const [lo, hi] = draft ?? committed;

  const suffix = listing === "rent" ? "/mo" : listing === "short_stay" ? "/night" : "";
  const label = (kes: number) =>
    currency === "KES" ? formatCompact(kes) : formatCompact(kesToUsd(kes, usdRate), "USD");
  const loLabel = lo === 0 ? "No min" : label(steps[lo]);
  const hiLabel = hi === last ? `${label(steps[last])}+` : label(steps[hi]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between font-mono text-sm">
        <span>{loLabel}</span>
        <span className="text-muted">—</span>
        <span>
          {hiLabel}
          <span className="text-muted">{suffix}</span>
        </span>
      </div>
      <Slider.Root
        className="relative flex h-6 w-full touch-none select-none items-center"
        min={0}
        max={last}
        step={1}
        minStepsBetweenThumbs={1}
        value={[lo, hi]}
        onValueChange={(v) => setDraft([v[0], v[1]])}
        onValueCommit={(v) => {
          setDraft(null);
          onCommit({
            minPrice: v[0] === 0 ? null : steps[v[0]],
            maxPrice: v[1] === last ? null : steps[v[1]],
          });
        }}
        aria-label="Price range"
      >
        <Slider.Track className="relative h-1 grow rounded-full bg-foreground/12">
          <Slider.Range className="absolute h-full rounded-full bg-gold-600 dark:bg-gold" />
        </Slider.Track>
        {[
          { key: "min", text: `Minimum price ${loLabel}` },
          { key: "max", text: `Maximum price ${hiLabel}` },
        ].map((t) => (
          <Slider.Thumb
            key={t.key}
            aria-label={t.key === "min" ? "Minimum price" : "Maximum price"}
            aria-valuetext={t.text}
            className="block size-5 rounded-full border-2 border-gold-600 bg-surface shadow-soft transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 dark:border-gold"
          />
        ))}
      </Slider.Root>
    </div>
  );
}
