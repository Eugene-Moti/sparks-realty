"use client";

import { CheckIcon, MinusIcon, ScalesIcon, XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import { compareAction } from "@/app/actions/search";
import { useCurrency } from "@/components/providers/currency-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/helpers/classname-helper";
import { formatKES } from "@/lib/format";
import { furnishingLabels, listingTypeLabels, propertyTypeLabels } from "@/lib/labels";
import type { CompareData } from "@/lib/queries/search";
import { AMENITIES } from "@/lib/search/filters";
import { useCompare } from "@/lib/stores/compare";
import type { Furnishing } from "@/types/db";

const subscribeNoop = () => () => {};
const numberFmt = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 });

type Row = { label: string; values: ReactNode[]; raw: unknown[] };

/** Side-by-side comparison of up to 3 homes (IDs stored on this device). */
export function CompareView() {
  const { ids, toggle, clear } = useCompare();
  const { format } = useCurrency();
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const [data, setData] = useState<CompareData[] | null>(null);
  const [onlyDiff, setOnlyDiff] = useState(false);
  const key = ids.join(",");

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    compareAction(key ? key.split(",") : []).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [key, mounted]);

  const homes = data?.filter((d) => ids.includes(d.id)) ?? null;

  if (!mounted || homes === null) {
    return <Skeleton className="h-[32rem] w-full rounded-(--radius-card)" />;
  }

  if (homes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-(--radius-card-lg) border border-hairline border-dashed px-6 py-20 text-center">
        <ScalesIcon className="size-12 text-accent" weight="thin" aria-hidden="true" />
        <p className="font-display text-3xl">Nothing to compare yet</p>
        <p className="max-w-md text-muted text-sm leading-relaxed">
          Press “Compare” on up to three homes and they&apos;ll line up here, side by side, with the
          differences highlighted.
        </p>
        <Button asChild>
          <Link href="/properties">Browse homes</Link>
        </Button>
      </div>
    );
  }

  const yesNo = (v: boolean | null) =>
    v === null ? <MinusIcon className="size-4 text-muted" aria-label="Not stated" /> : v ? <CheckIcon className="size-4 text-green-600" aria-label="Yes" /> : <XIcon className="size-4 text-muted" aria-label="No" />;
  const num = (v: number | null, unit = "") => (v === null ? "—" : `${numberFmt.format(v)}${unit}`);

  const rows: Row[] = [
    { label: "Price", raw: homes.map((h) => h.priceKes), values: homes.map((h) => {
      const p = format({ priceKes: h.priceKes, period: h.pricePeriod, priceOnRequest: h.priceOnRequest });
      return (
        <span key={h.id} className="flex flex-col">
          <span className="font-mono">{p.primary}</span>
          {p.secondary ? <span className="font-mono text-muted text-xs">{p.secondary}</span> : null}
        </span>
      );
    }) },
    { label: "Listing", raw: homes.map((h) => h.listingType), values: homes.map((h) => listingTypeLabels[h.listingType]) },
    { label: "Type", raw: homes.map((h) => h.propertyType), values: homes.map((h) => propertyTypeLabels[h.propertyType]) },
    { label: "Area", raw: homes.map((h) => h.areaName), values: homes.map((h) => h.areaName ?? "—") },
    { label: "Bedrooms", raw: homes.map((h) => h.bedrooms), values: homes.map((h) => num(h.bedrooms)) },
    { label: "Bathrooms", raw: homes.map((h) => h.bathrooms), values: homes.map((h) => num(h.bathrooms)) },
    { label: "Ensuites", raw: homes.map((h) => h.ensuites), values: homes.map((h) => num(h.ensuites)) },
    { label: "DSQ", raw: homes.map((h) => h.dsq), values: homes.map((h) => yesNo(h.dsq)) },
    { label: "Parking", raw: homes.map((h) => h.parking), values: homes.map((h) => num(h.parking)) },
    { label: "Floor area", raw: homes.map((h) => h.floorArea), values: homes.map((h) => num(h.floorArea, " m²")) },
    { label: "Land", raw: homes.map((h) => h.landAcres), values: homes.map((h) => num(h.landAcres, " acres")) },
    { label: "Furnishing", raw: homes.map((h) => h.furnishing), values: homes.map((h) => (h.furnishing ? furnishingLabels[h.furnishing as Furnishing] : "—")) },
    { label: "Service charge", raw: homes.map((h) => h.serviceChargeKes), values: homes.map((h) => (h.serviceChargeKes ? `${formatKES(h.serviceChargeKes)}/mo` : "—")) },
    { label: "Deposit", raw: homes.map((h) => h.depositMonths), values: homes.map((h) => (h.depositMonths ? `${numberFmt.format(h.depositMonths)} months` : "—")) },
    { label: "Available from", raw: homes.map((h) => h.availableFrom), values: homes.map((h) => h.availableFrom ?? "—") },
    { label: "Max guests", raw: homes.map((h) => h.maxGuests), values: homes.map((h) => num(h.maxGuests)) },
    { label: "Cleaning fee", raw: homes.map((h) => h.cleaningFeeKes), values: homes.map((h) => (h.cleaningFeeKes ? formatKES(h.cleaningFeeKes) : "—")) },
    // DSQ already has its own row above.
    ...AMENITIES.filter((a) => a.value !== "dsq").map((a) => ({
      label: a.label,
      raw: homes.map((h) => h.amenities.includes(a.value)),
      values: homes.map((h) => yesNo(h.amenities.includes(a.value))),
    })),
  ];

  const differs = (r: Row) => new Set(r.raw.map((v) => JSON.stringify(v ?? null))).size > 1;
  // Hide rows where no home has a value at all.
  const meaningful = rows.filter((r) => r.raw.some((v) => v !== null && v !== false && v !== undefined));
  const shown = onlyDiff && homes.length > 1 ? meaningful.filter(differs) : meaningful;
  const cols = `minmax(9rem,0.8fr) repeat(${homes.length}, minmax(14rem,1fr))`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyDiff}
            onChange={(e) => setOnlyDiff(e.target.checked)}
            className="size-4 accent-green-600"
          />
          Only show differences
        </label>
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear compare list
        </Button>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" data-lenis-prevent>
        <div role="table" aria-label="Property comparison" className="min-w-fit">
          {/* Sticky header with photos */}
          <div role="row" className="sticky top-18 z-10 grid gap-4 border-hairline border-b bg-background/90 py-4 backdrop-blur lg:top-20" style={{ gridTemplateColumns: cols }}>
            <div role="columnheader" className="self-end text-muted text-xs">
              {homes.length} of 3 homes
            </div>
            {homes.map((h) => (
              <div key={h.id} role="columnheader" className="flex flex-col gap-3">
                <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-surface-2">
                  {h.images[0] ? <Image src={h.images[0].src} alt="" fill sizes="280px" className="object-cover" /> : null}
                  <button
                    type="button"
                    onClick={() => toggle(h.id)}
                    aria-label={`Remove ${h.title} from compare`}
                    className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-ink/60 text-ivory backdrop-blur hover:bg-ink/80"
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>
                <Link href={h.href} className="line-clamp-2 font-display text-lg leading-snug hover:text-accent">
                  {h.title}
                </Link>
              </div>
            ))}
          </div>

          {shown.map((r) => {
            const diff = homes.length > 1 && differs(r);
            return (
              <div
                key={r.label}
                role="row"
                className={cn("grid gap-4 border-hairline border-b px-2 py-3 text-sm", diff && "bg-gold-400/8")}
                style={{ gridTemplateColumns: cols }}
              >
                <div role="rowheader" className="flex items-center gap-2 text-muted">
                  {r.label}
                  {diff ? <span className="size-1.5 rounded-full bg-gold-600 dark:bg-gold" aria-label="differs" /> : null}
                </div>
                {r.values.map((v, i) => (
                  <div key={homes[i].id} role="cell" className="flex items-center">
                    {v}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-muted text-xs">Rows marked with a gold dot differ between the homes.</p>
    </div>
  );
}
