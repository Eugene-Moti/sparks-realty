"use client";

import {
  ListBulletsIcon,
  MapTrifoldIcon,
  SquaresFourIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useQueryStates } from "nuqs";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { loadMoreAction, mapPointsAction } from "@/app/actions/search";
import { easeOut } from "@/components/motion/easing";
import { PropertyCard, PropertyCardSkeleton } from "@/components/property/property-card";
import { useContact } from "@/components/providers/contact-provider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/helpers/classname-helper";
import { whatsappLink } from "@/lib/format";
import { listingTypeLabels, propertyTypeLabels } from "@/lib/labels";
import type { MapPoint, SearchResult } from "@/lib/queries/search";
import { countActive, type FixedFilters, NEARBY_AREAS, toFilters } from "@/lib/search/filters";
import { type SearchParamsState, type SortKey, searchParsers, serializeSearch, type ViewKey } from "@/lib/search/params";
import type { PropertyType } from "@/types/db";
import { ActiveChips } from "./active-chips";
import { FilterControls, type FilterPatch } from "./filter-controls";
import { FiltersSheet } from "./filters-sheet";
import { SaveSearchDialog } from "./save-search-dialog";

const ListingsMap = dynamic(() => import("./listings-map"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-(--radius-card)" />,
});

// View changes are client-only; everything else re-runs the server query.
const clientParsers = { ...searchParsers, view: searchParsers.view.withOptions({ shallow: true }) };

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "popular", label: "Most viewed" },
];

const VIEW_OPTIONS: { value: ViewKey; label: string; icon: typeof SquaresFourIcon }[] = [
  { value: "grid", label: "Grid", icon: SquaresFourIcon },
  { value: "list", label: "List", icon: ListBulletsIcon },
  { value: "map", label: "Map", icon: MapTrifoldIcon },
];

type SearchExperienceProps = {
  initial: SearchResult;
  fixed: FixedFilters;
  areas: { slug: string; name: string }[];
  basePath: string;
};

export function SearchExperience({ initial, fixed, areas, basePath }: SearchExperienceProps) {
  const reduce = useReducedMotion();
  const { whatsapp } = useContact();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useQueryStates(clientParsers, {
    shallow: false,
    scroll: false,
    history: "replace",
    startTransition,
  });

  const filters = useMemo(() => toFilters(state, fixed), [state, fixed]);
  const filtersKey = JSON.stringify(filters);
  const areaNames = useMemo(() => Object.fromEntries(areas.map((a) => [a.slug, a.name])), [areas]);
  const activeCount = countActive(filters, fixed);
  // Short stays: carry the searched dates and guests into the listing's booking widget.
  const stayQuery = filters.checkIn && filters.checkOut
    ? `?checkIn=${filters.checkIn}&checkOut=${filters.checkOut}${filters.guests ? `&guests=${filters.guests}` : ""}`
    : "";

  // ---------- Accumulated results (reset when the server sends a new first page) ----------
  const [items, setItems] = useState(initial.items);
  const [page, setPage] = useState(1);
  const [seenInitial, setSeenInitial] = useState(initial);
  // Layout animations only after the first change (filters, sort, load more): measuring every
  // card on page load would block the main thread for nothing.
  const [animateLayout, setAnimateLayout] = useState(false);
  if (initial !== seenInitial) {
    setSeenInitial(initial);
    setAnimateLayout(true);
    setItems(initial.items);
    setPage(1);
  }
  const [loadingMore, startLoadingMore] = useTransition();
  const hasMore = items.length < initial.total;

  const loadMore = () => {
    setAnimateLayout(true);
    startLoadingMore(async () => {
      const next = await loadMoreAction(state, fixed, page + 1);
      setItems((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...next.items.filter((p) => !ids.has(p.id))];
      });
      setPage(page + 1);
    });
  };

  // ---------- Map points (fetched only in map view) ----------
  const [points, setPoints] = useState<MapPoint[] | null>(null);
  const [pointsKey, setPointsKey] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  useEffect(() => {
    if (state.view !== "map" || pointsKey === filtersKey) return;
    let cancelled = false;
    mapPointsAction(state, fixed).then((p) => {
      if (cancelled) return;
      setPoints(p);
      setPointsKey(filtersKey);
    });
    return () => {
      cancelled = true;
    };
  }, [state, fixed, filtersKey, pointsKey]);

  const update = useCallback((patch: FilterPatch) => void setState(patch), [setState]);

  const summary = describe(filters, areaNames);
  const nearby = (NEARBY_AREAS[fixed.area ?? filters.areas[0] ?? ""] ?? ["kileleshwa", "kilimani", "westlands"])
    .filter((slug) => areaNames[slug])
    .slice(0, 3);

  const view = state.view;
  const listClass =
    view === "list"
      ? "grid gap-5"
      : view === "map"
        ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-1"
        : "grid gap-6 sm:grid-cols-2 xl:grid-cols-3";

  return (
    <div className="mx-auto grid w-full max-w-[90rem] gap-10 px-4 pb-24 sm:px-6 lg:grid-cols-[18.5rem_minmax(0,1fr)] lg:px-10">
      {/* ---------- Desktop sidebar ---------- */}
      <aside aria-label="Filters" className="hidden lg:block">
        <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-3 pb-6 scrollbar-none" data-lenis-prevent>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl">Filters</h2>
            {activeCount > 0 ? (
              <button
                type="button"
                onClick={() => update(clearPatch(state))}
                className="text-muted text-xs underline-offset-4 hover:text-foreground hover:underline"
              >
                Clear all
              </button>
            ) : null}
          </div>
          <FilterControls value={state} onChange={update} fixed={fixed} areas={areas} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col gap-6">
        {/* ---------- Toolbar ---------- */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted text-sm" aria-live="polite">
              <span className="font-medium font-mono text-foreground">{initial.total}</span>{" "}
              {initial.total === 1 ? "result" : "results"} {summary ? <>· {summary}</> : null}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <FiltersSheet
                value={state}
                onApply={(next) => void setState(next)}
                fixed={fixed}
                areas={areas}
                activeCount={activeCount}
                total={initial.total}
              />
              <label className="sr-only" htmlFor="sort">
                Sort by
              </label>
              <Select
                id="sort"
                value={state.sort}
                onChange={(e) => update({ sort: e.target.value as SortKey })}
                options={SORT_OPTIONS}
                className="w-48 [&_select]:h-11 [&_select]:rounded-full"
              />
              <div role="radiogroup" aria-label="View" className="flex rounded-full border border-border p-1">
                {VIEW_OPTIONS.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    role="radio"
                    aria-checked={view === v.value}
                    onClick={() => update({ view: v.value })}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-full px-3 font-medium text-sm transition-colors",
                      view === v.value ? "bg-foreground text-background" : "text-muted hover:text-foreground",
                    )}
                  >
                    <v.icon className="size-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{v.label}</span>
                    <span className="sr-only sm:hidden">{v.label}</span>
                  </button>
                ))}
              </div>
              <SaveSearchDialog summary={summary || "all homes"} />
            </div>
          </div>
          <ActiveChips value={state} fixed={fixed} areaNames={areaNames} onChange={update} />
        </div>

        {/* ---------- Results ---------- */}
        {initial.total === 0 && !isPending ? (
          <EmptyState
            nearby={nearby.map((slug) => ({
              slug,
              name: areaNames[slug],
              href: `${basePath.startsWith("/areas/") ? "/properties" : basePath}${serializeSearch({ ...state, area: [slug] })}`,
            }))}
            onClear={() => update(clearPatch(state))}
            whatsappHref={whatsappLink(`Hi Sparks Properties, I'm looking for: ${summary || "a home in Nairobi"}.`, whatsapp)}
            summary={summary}
          />
        ) : (
          <div className={cn(view === "map" && "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]")}>
            {view === "map" ? (
              <div className="order-first h-[60vh] lg:order-last lg:sticky lg:top-28 lg:h-[calc(100vh-8rem)]">
                {points ? (
                  <ListingsMap points={points} hoveredId={hoveredId} onHover={setHoveredId} />
                ) : (
                  <Skeleton className="size-full rounded-(--radius-card)" />
                )}
              </div>
            ) : null}

            <div className={cn("flex flex-col gap-8 transition-opacity duration-300", isPending && "pointer-events-none opacity-50")}>
              <ul className={listClass} aria-busy={isPending}>
                <AnimatePresence mode="popLayout" initial={false}>
                  {items.map((p, i) => (
                    <motion.li
                      key={p.id}
                      layout={!reduce && animateLayout}
                      initial={reduce ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.35, ease: easeOut, delay: reduce ? 0 : Math.min(i % 12, 8) * 0.03 }}
                      onPointerEnter={() => setHoveredId(p.id)}
                      onPointerLeave={() => setHoveredId(null)}
                    >
                      <PropertyCard
                        property={stayQuery && p.listingType === "short_stay" ? { ...p, href: `${p.href}${stayQuery}` } : p}
                        layout={view === "list" ? "list" : "grid"}
                        priority={i < 3}
                        className={cn("h-full", hoveredId === p.id && view === "map" && "ring-2 ring-gold-600 dark:ring-gold")}
                      />
                    </motion.li>
                  ))}
                  {loadingMore
                    ? Array.from({ length: 3 }, (_, i) => (
                        <li key={`sk-${i}`}>
                          <PropertyCardSkeleton />
                        </li>
                      ))
                    : null}
                </AnimatePresence>
              </ul>

              {hasMore ? (
                <div className="flex flex-col items-center gap-2">
                  <Button variant="gold-outline" size="lg" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? "Loading…" : "Load more homes"}
                  </Button>
                  <p className="text-muted text-xs">
                    Showing {items.length} of {initial.total}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function clearPatch(state: SearchParamsState): FilterPatch {
  return {
    listing: null,
    area: [],
    type: [],
    minPrice: null,
    maxPrice: null,
    beds: null,
    baths: null,
    furnishing: [],
    amenities: [],
    available: null,
    q: null,
    checkIn: null,
    checkOut: null,
    guests: null,
    sort: state.sort,
    view: state.view,
  };
}

/** Short human summary, e.g. "3+ bed apartments to rent in Kileleshwa". */
function describe(f: ReturnType<typeof toFilters>, areaNames: Record<string, string>): string {
  const parts: string[] = [];
  if (f.beds) parts.push(`${f.beds}+ bed`);
  parts.push(
    f.types.length === 1
      ? `${propertyTypeLabels[f.types[0] as PropertyType].toLowerCase()}s`
      : f.listing === "short_stay"
        ? "short stays"
        : "homes",
  );
  if (f.listing && f.listing !== "short_stay") parts.push(listingTypeLabels[f.listing].toLowerCase());
  if (f.areas.length) parts.push(`in ${f.areas.map((a) => areaNames[a] ?? a).join(", ")}`);
  const text = parts.join(" ");
  return text === "homes" ? "" : text;
}

function EmptyState({
  nearby,
  onClear,
  whatsappHref,
  summary,
}: {
  nearby: { slug: string; name: string; href: string }[];
  onClear: () => void;
  whatsappHref: string;
  summary: string;
}) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-(--radius-card-lg) border border-hairline border-dashed px-6 py-16 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/mark.svg" alt="" className="size-16 opacity-40" />
      <div className="flex max-w-lg flex-col gap-2">
        <p className="font-display text-3xl">No exact matches — yet</p>
        <p className="text-muted text-sm leading-relaxed">
          New homes come in every week, and many never reach the portals. Try nearby areas, loosen
          a filter, or save this search and we&apos;ll email you the moment one fits.
        </p>
      </div>
      {nearby.length ? (
        <div className="flex flex-col items-center gap-3">
          <p className="eyebrow">Try nearby</p>
          <div className="flex flex-wrap justify-center gap-2">
            {nearby.map((a) => (
              <Button key={a.slug} asChild variant="gold-outline" size="sm">
                <Link href={a.href}>{a.name}</Link>
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="ghost" onClick={onClear}>
          Clear all filters
        </Button>
        <SaveSearchDialog summary={summary || "all homes"} triggerVariant="gold-outline" triggerLabel="Alert me" />
        <Button asChild>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <WhatsappLogoIcon weight="fill" /> Ask on WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}
