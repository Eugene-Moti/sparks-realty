import { PropertyCardSkeleton } from "@/components/property/property-card";
import { SearchSkeleton } from "@/components/search/search-page";
import { Skeleton } from "@/components/ui/skeleton";

/** Shimmer placeholders used by the routes' loading.tsx files (static under reduced motion). */

function HeaderSkeleton({ dark = false }: { dark?: boolean }) {
  return dark ? (
    <div className="dark bg-ink">
      <div className="mx-auto flex min-h-[44vh] w-full max-w-[90rem] flex-col justify-end gap-4 px-4 pt-24 pb-14 sm:px-6 lg:px-10">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-14 w-3/4 max-w-2xl" />
        <Skeleton className="h-5 w-2/3 max-w-xl" />
      </div>
    </div>
  ) : (
    <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-4 px-4 pt-10 pb-10 sm:px-6 lg:px-10 lg:pt-14">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-14 w-3/4 max-w-2xl" />
      <Skeleton className="h-5 w-2/3 max-w-xl" />
    </div>
  );
}

const Busy = ({ children }: { children: React.ReactNode }) => (
  <div aria-busy="true" aria-label="Loading" className="flex flex-1 flex-col">
    {children}
  </div>
);

/** Generic content page: header + text and cards. */
export function ContentPageSkeleton({ dark = false }: { dark?: boolean }) {
  return (
    <Busy>
      <HeaderSkeleton dark={dark} />
      <div className="mx-auto grid w-full max-w-[90rem] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:px-10">
        <div className="flex flex-col gap-4">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-4" style={{ width: `${92 - ((i * 13) % 30)}%` }} />
          ))}
        </div>
        <Skeleton className="h-96 rounded-(--radius-card)" />
      </div>
    </Busy>
  );
}

/** Grid of cards (areas, insights, tours). */
export function GridPageSkeleton({ aspect = "aspect-3/4" }: { aspect?: string }) {
  return (
    <Busy>
      <HeaderSkeleton />
      <div className="mx-auto grid w-full max-w-[90rem] gap-6 px-4 pb-24 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-10">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col gap-4">
            <Skeleton className={`${aspect} rounded-(--radius-card)`} />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-6 w-4/5" />
          </div>
        ))}
      </div>
    </Busy>
  );
}

/** Search/listing pages (/buy, /rent, /short-stays, /properties, /areas/[slug]). */
export function ListingsPageSkeleton({ dark = false }: { dark?: boolean }) {
  return (
    <Busy>
      <HeaderSkeleton dark={dark} />
      <div className="mt-10">
        <SearchSkeleton />
      </div>
    </Busy>
  );
}

/** Property / short-stay detail page. */
export function DetailPageSkeleton() {
  return (
    <Busy>
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-8 px-4 pt-8 pb-24 sm:px-6 lg:px-10">
        <Skeleton className="h-3 w-56" />
        <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
          <Skeleton className="aspect-4/3 rounded-(--radius-card) lg:aspect-auto lg:h-[34rem]" />
          <div className="hidden grid-rows-2 gap-3 lg:grid">
            <Skeleton className="rounded-(--radius-card)" />
            <Skeleton className="rounded-(--radius-card)" />
          </div>
        </div>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-4/5" />
            <Skeleton className="h-5 w-1/2" />
            <div className="flex gap-6 border-hairline border-y py-5">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-4" style={{ width: `${95 - i * 7}%` }} />
            ))}
          </div>
          <Skeleton className="h-80 rounded-(--radius-card)" />
        </div>
      </div>
    </Busy>
  );
}

/** Insight article. */
export function ArticleSkeleton() {
  return (
    <Busy>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pt-10 sm:px-6 lg:pt-14">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
      <div className="mx-auto mt-6 w-full max-w-6xl px-4 sm:px-6">
        <Skeleton className="aspect-video rounded-(--radius-card)" />
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-12 sm:px-6">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${96 - ((i * 11) % 25)}%` }} />
        ))}
      </div>
    </Busy>
  );
}

/** Favourites / compare (local-only lists). */
export function SavedPageSkeleton() {
  return (
    <Busy>
      <HeaderSkeleton />
      <div className="mx-auto grid w-full max-w-[90rem] gap-6 px-4 pb-24 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-10">
        {Array.from({ length: 3 }, (_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    </Busy>
  );
}
