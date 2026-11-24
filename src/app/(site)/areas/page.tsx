import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { Reveal, RevealGroup } from "@/components/motion/reveal";
import { formatCompact } from "@/lib/format";
import { type AreaSummary, getAreasWithStats } from "@/lib/queries/areas";

export const metadata: Metadata = {
  title: "Nairobi area guides",
  description:
    "Neighbourhood guides to Kileleshwa, Kilimani, Lavington, Westlands, Riverside, Karen and more — average rents and prices, schools, shopping and homes available now.",
  alternates: { canonical: "/areas" },
};

export default async function AreasPage() {
  const areas = await getAreasWithStats();

  return (
    <>
      <PageHero
        eyebrow="Area guides"
        title="Find your neighbourhood"
        description="What it's like to live in each part of Nairobi we cover — with live average prices from the homes we have right now."
        crumbs={[{ name: "Areas", href: "/areas" }]}
      />
      <div className="mx-auto w-full max-w-[90rem] px-4 pb-28 sm:px-6 lg:px-10">
        {areas.length ? (
          <RevealGroup as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((a, i) => (
              <AreaCard key={a.id} area={a} priority={i < 3} />
            ))}
          </RevealGroup>
        ) : (
          <p className="rounded-(--radius-card) border border-hairline border-dashed p-10 text-center text-muted">Area guides are on the way.</p>
        )}
      </div>
    </>
  );
}

function AreaCard({ area: a, priority }: { area: AreaSummary; priority: boolean }) {
  return (
    <Reveal as="li">
      <Link
        href={`/areas/${a.slug}`}
        className="group dark relative isolate flex aspect-4/5 flex-col justify-end overflow-hidden rounded-(--radius-card) bg-ink p-6 text-ivory sm:aspect-3/4"
      >
        {a.heroImage ? (
          <Image
            src={a.heroImage}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="-z-10 object-cover opacity-75 transition-transform duration-[1.2s] ease-(--ease-out-brand) group-hover:scale-[1.05]"
          />
        ) : (
          <span aria-hidden="true" className="grain absolute inset-0 -z-10" />
        )}
        <span aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/40 to-transparent" />
        <span className="absolute top-5 right-5 grid size-10 place-items-center rounded-full border border-ivory/25 bg-ink/40 backdrop-blur transition-colors group-hover:border-gold group-hover:text-gold">
          <ArrowUpRightIcon className="size-4" />
        </span>
        <h2 className="font-display text-4xl">{a.name}</h2>
        {a.summary ? <p className="mt-2 line-clamp-2 text-ivory/75 text-sm leading-relaxed">{a.summary}</p> : null}
        <dl className="mt-5 grid grid-cols-3 gap-3 border-ivory/15 border-t pt-4 text-xs">
          <div>
            <dt className="text-ivory/55">Homes</dt>
            <dd className="font-mono text-base text-gold">{a.listingCount}</dd>
          </div>
          <div>
            <dt className="text-ivory/55">Avg rent</dt>
            <dd className="font-mono text-sm sm:text-base">{a.avgRentKes ? formatCompact(a.avgRentKes) : "—"}</dd>
          </div>
          <div>
            <dt className="text-ivory/55">Avg price</dt>
            <dd className="font-mono text-sm sm:text-base">{a.avgSaleKes ? formatCompact(a.avgSaleKes) : "—"}</dd>
          </div>
        </dl>
      </Link>
    </Reveal>
  );
}
