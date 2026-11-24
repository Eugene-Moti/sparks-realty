import { type ReactNode, Suspense } from "react";
import { PropertyCardSkeleton } from "@/components/property/property-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAreasWithStats } from "@/lib/queries/areas";
import { searchProperties } from "@/lib/queries/search";
import { type FixedFilters, toFilters } from "@/lib/search/filters";
import { loadSearchParams } from "@/lib/search/params";
import { SearchExperience } from "./search-experience";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  fixed?: FixedFilters;
  /** Path of the page, used for links that keep the visitor on it. */
  basePath: string;
  /** Static header (rendered into the prerendered shell). */
  header: ReactNode;
};

/**
 * Shared listing page: a static header plus the search experience, which reads
 * the URL inside a Suspense boundary (required with Cache Components).
 */
export function SearchPage({ searchParams, fixed = {}, basePath, header }: SearchPageProps) {
  return (
    <>
      {header}
      <Suspense fallback={<SearchSkeleton />}>
        <SearchResults searchParams={searchParams} fixed={fixed} basePath={basePath} />
      </Suspense>
    </>
  );
}

async function SearchResults({
  searchParams,
  fixed,
  basePath,
}: {
  searchParams: SearchPageProps["searchParams"];
  fixed: FixedFilters;
  basePath: string;
}) {
  const state = await loadSearchParams(searchParams);
  const filters = toFilters(state, fixed);
  const [result, areas] = await Promise.all([searchProperties(filters, 1), getAreasWithStats()]);

  return (
    <SearchExperience
      initial={result}
      fixed={fixed}
      areas={areas.map((a) => ({ slug: a.slug, name: a.name }))}
      basePath={basePath}
    />
  );
}

export function SearchSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-[90rem] gap-10 px-4 pb-24 sm:px-6 lg:grid-cols-[18.5rem_minmax(0,1fr)] lg:px-10" aria-busy="true">
      <div className="hidden flex-col gap-6 lg:flex">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="h-3 w-24" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-20 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between gap-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-11 w-64 rounded-full" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Page header used by the listing routes. */
export function SearchHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="mx-auto flex w-full max-w-[90rem] flex-col gap-4 px-4 pt-12 pb-10 sm:px-6 lg:px-10 lg:pt-16">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="max-w-3xl text-[clamp(2.25rem,5vw,4rem)] leading-[1.02]">{title}</h1>
      <p className="max-w-2xl text-muted leading-relaxed">{description}</p>
    </header>
  );
}
