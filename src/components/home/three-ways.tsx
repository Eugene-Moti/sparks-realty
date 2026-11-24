import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { Reveal, RevealGroup } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import type { ListingCounts } from "@/lib/queries/properties";
import type { ListingType } from "@/types/db";

type Tile = {
  type: ListingType;
  title: string;
  href: string;
  blurb: string;
  noun: [string, string];
};

const TILES: Tile[] = [
  { type: "sale", title: "Buy", href: "/buy", blurb: "Maisonettes, villas and apartments with clean titles and honest advice.", noun: ["home for sale", "homes for sale"] },
  { type: "rent", title: "Rent", href: "/rent", blurb: "Long-term rentals with lifts, boreholes and backup power — viewed in days, not weeks.", noun: ["home to rent", "homes to rent"] },
  { type: "short_stay", title: "Short Stays", href: "/short-stays", blurb: "Furnished, serviced stays for business trips, visits home and long weekends.", noun: ["short stay", "short stays"] },
];

export function ThreeWays({
  counts,
  images,
}: {
  counts: ListingCounts;
  images: Partial<Record<ListingType, string>>;
}) {
  return (
    <section aria-labelledby="three-ways-title" className="mx-auto w-full max-w-[90rem] px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
      <SectionHeading
        id="three-ways-title"
        eyebrow="Live with Sparks Properties"
        title="Three ways to call Nairobi home"
        align="center"
      />
      <RevealGroup className="mt-14 grid gap-4 md:grid-cols-3 lg:gap-6">
        {TILES.map((t) => {
          const count = counts[t.type];
          const img = images[t.type];
          return (
            <Reveal key={t.type}>
              <Link
                href={t.href}
                className="group relative flex aspect-4/5 flex-col justify-end overflow-hidden rounded-(--radius-card-lg) bg-ink text-ivory shadow-soft md:aspect-3/4"
              >
                {img ? (
                  <Image
                    src={img}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-[1.2s] ease-(--ease-out-brand) group-hover:scale-[1.07]"
                  />
                ) : null}
                <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-ink via-ink/40 to-ink/5" />
                <div className="relative z-10 flex flex-col gap-3 p-6 sm:p-8">
                  <p className="font-mono text-gold-200 text-xs tracking-wider">
                    {count > 0 ? `${count} ${count === 1 ? t.noun[0] : t.noun[1]}` : "Ask us what's coming up"}
                  </p>
                  <h3 className="font-display text-4xl sm:text-5xl">{t.title}</h3>
                  <p className="max-w-xs text-ivory/75 text-sm leading-relaxed">{t.blurb}</p>
                  <span className="mt-2 inline-flex items-center gap-2 font-medium text-gold text-sm">
                    Explore
                    <ArrowUpRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </RevealGroup>
    </section>
  );
}
