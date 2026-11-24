"use client";

import { FadersHorizontalIcon } from "@phosphor-icons/react";
import { useEffect, useState, useTransition } from "react";
import { countAction } from "@/app/actions/search";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { FixedFilters } from "@/lib/search/filters";
import { emptySearchState, type SearchParamsState } from "@/lib/search/params";
import { FilterControls, type FilterPatch } from "./filter-controls";

type FiltersSheetProps = {
  value: SearchParamsState;
  onApply: (next: SearchParamsState) => void;
  fixed: FixedFilters;
  areas: { slug: string; name: string }[];
  activeCount: number;
  total: number;
};

/** Mobile filters: edit a draft, see the live result count, apply in one go. */
export function FiltersSheet({ value, onApply, fixed, areas, activeCount, total }: FiltersSheetProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [count, setCount] = useState(total);
  const [counting, startCounting] = useTransition();

  // Refresh the "Show N homes" count as the draft changes (debounced).
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      startCounting(async () => setCount(await countAction(draft, fixed)));
    }, 300);
    return () => window.clearTimeout(t);
  }, [draft, fixed, open]);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setDraft(value);
          setCount(total);
        }
        setOpen(o);
      }}
    >
      <SheetTrigger asChild>
        <Button variant="gold-outline" size="md" className="lg:hidden">
          <FadersHorizontalIcon />
          Filters
          {activeCount > 0 ? (
            <span className="grid min-w-5 place-items-center rounded-full bg-gold-600 px-1.5 font-mono text-[0.65rem] text-ivory leading-5 dark:bg-gold dark:text-ink">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="flex h-[92dvh] max-h-none flex-col overflow-hidden px-0 pb-0">
        <div className="flex items-center justify-between px-5 pt-3 pb-4">
          <div>
            <SheetTitle className="font-display text-2xl">Filters</SheetTitle>
            <SheetDescription className="sr-only">Refine the homes shown.</SheetDescription>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6" data-lenis-prevent>
          <FilterControls
            value={draft}
            onChange={(patch: FilterPatch) => setDraft((d) => ({ ...d, ...patch }))}
            fixed={fixed}
            areas={areas}
          />
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-3 border-hairline border-t bg-surface px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            variant="ghost"
            onClick={() => setDraft({ ...emptySearchState, sort: draft.sort, view: draft.view })}
          >
            Clear all
          </Button>
          <Button
            size="lg"
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
            aria-live="polite"
          >
            {counting ? "Counting…" : count === 0 ? "No matches — show anyway" : `Show ${count} ${count === 1 ? "home" : "homes"}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
