import { BuildingsIcon, FirstAidKitIcon, GraduationCapIcon, ShoppingBagIcon } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/content/markdown";
import { FaqList, faqJsonLd } from "@/components/content/process-steps";
import { Breadcrumbs } from "@/components/layout/page-hero";
import { LocationReveal } from "@/components/property/detail/location-reveal";
import { SearchPage } from "@/components/search/search-page";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/config/site";
import { type NearbyCategory, NEARBY_PLACES, nearbyCategoryLabels } from "@/content/nearby-places";
import { formatKES } from "@/lib/format";
import { type AreaDetail, type AreaSummary, getAreaBySlug, getAreaSlugs, getAreasWithStats } from "@/lib/queries/areas";

export async function generateStaticParams() {
  const slugs = await getAreaSlugs();
  // At least one param is required for build-time validation with Cache Components.
  return (slugs.length ? slugs : ["kileleshwa"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/areas/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const area = await getAreaBySlug(slug);
  if (!area) return { title: "Area not found" };
  return {
    title: `Living in ${area.name}, Nairobi — area guide & homes`,
    description:
      area.summary ?? `What it's like to live in ${area.name}, Nairobi: average rents and prices, schools and shopping nearby, and homes for sale, rent and short stay.`,
    alternates: { canonical: `/areas/${area.slug}` },
    openGraph: area.hero_image ? { images: [{ url: area.hero_image }] } : undefined,
  };
}

const NEARBY_ICONS: Record<NearbyCategory, Icon> = { school: GraduationCapIcon, health: FirstAidKitIcon, shopping: ShoppingBagIcon };

/** Area guide (staff-written), live stats, map, nearby places and FAQs — then every listing in the area (filters work). */
export default async function AreaPage({ params, searchParams }: PageProps<"/areas/[slug]">) {
  const { slug } = await params;
  const [area, all] = await Promise.all([getAreaBySlug(slug), getAreasWithStats()]);
  if (!area) notFound();
  const stats = all.find((a) => a.slug === area.slug) ?? null;
  const faqs = buildFaqs(area, stats);

  return (
    <SearchPage
      searchParams={searchParams}
      fixed={{ area: area.slug }}
      basePath={`/areas/${area.slug}`}
      header={
        <>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "Place",
              name: `${area.name}, Nairobi`,
              url: absoluteUrl(`/areas/${area.slug}`),
              description: area.summary ?? undefined,
              ...(area.latitude && area.longitude ? { geo: { "@type": "GeoCoordinates", latitude: area.latitude, longitude: area.longitude } } : {}),
              containedInPlace: { "@type": "City", name: "Nairobi" },
            }}
          />
          {faqs.length ? <JsonLd data={faqJsonLd(faqs)} /> : null}

          <header className="dark grain relative isolate overflow-hidden bg-ink text-ivory">
            {area.hero_image ? <Image src={area.hero_image} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-55" /> : null}
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/50 to-ink/20" />
            <div className="relative z-10 mx-auto flex min-h-[50vh] w-full max-w-[90rem] flex-col justify-end gap-4 px-4 pt-24 pb-12 sm:px-6 lg:px-10">
              <Breadcrumbs
                items={[
                  { name: "Areas", href: "/areas" },
                  { name: area.name, href: `/areas/${area.slug}` },
                ]}
              />
              <p className="eyebrow">{area.county}</p>
              <h1 className="text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95]">{area.name}</h1>
              {area.summary ? <p className="max-w-2xl text-ivory/80 leading-relaxed sm:text-lg">{area.summary}</p> : null}
              {stats ? <AreaStats stats={stats} /> : null}
            </div>
          </header>

          <AreaGuide area={area} />

          {faqs.length ? (
            <section aria-labelledby="area-faq" className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
              <h2 id="area-faq" className="mb-8 font-display text-[clamp(1.9rem,3.5vw,2.75rem)]">
                {area.name}: common questions
              </h2>
              <FaqList items={faqs} />
            </section>
          ) : null}

          <div className="mx-auto w-full max-w-[90rem] px-4 pb-8 sm:px-6 lg:px-10">
            <p className="eyebrow">Available now</p>
            <h2 id="homes" className="mt-3 scroll-mt-24 font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.05]">
              Homes in {area.name}
            </h2>
          </div>
        </>
      }
    />
  );
}

function AreaStats({ stats }: { stats: AreaSummary }) {
  const items = [
    { label: "Homes listed", value: String(stats.listingCount) },
    stats.avgRentKes ? { label: "Average rent", value: `${formatKES(Math.round(stats.avgRentKes / 1000) * 1000)}/mo` } : null,
    stats.avgSaleKes ? { label: "Average asking price", value: formatKES(Math.round(stats.avgSaleKes / 100_000) * 100_000) } : null,
  ].filter((x): x is { label: string; value: string } => !!x);
  return (
    <div className="mt-6 flex max-w-3xl flex-col gap-4 border-ivory/15 border-t pt-6">
    <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
      {items.map((s) => (
        <div key={s.label}>
          <dt className="text-ivory/55 text-xs">{s.label}</dt>
          <dd className="mt-1 font-mono text-gold text-lg sm:text-xl">{s.value}</dd>
        </div>
      ))}
    </dl>
      <p className="text-ivory/55 text-xs">Based on homes currently listed with Sparks Properties — updated automatically.</p>
    </div>
  );
}

function AreaGuide({ area }: { area: AreaDetail }) {
  const places = NEARBY_PLACES[area.slug] ?? [];
  const groups = (Object.keys(nearbyCategoryLabels) as NearbyCategory[])
    .map((c) => ({ c, items: places.filter((p) => p.category === c) }))
    .filter((g) => g.items.length);
  const hasMap = area.latitude != null && area.longitude != null;
  if (!area.guide_md && !groups.length && !hasMap) return null;

  return (
    <section aria-labelledby="guide-title" className="mx-auto grid w-full max-w-[90rem] gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16 lg:px-10">
      <div className="min-w-0">
        <p className="eyebrow">Area guide</p>
        <h2 id="guide-title" className="mt-3 mb-8 font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.05]">
          Living in {area.name}
        </h2>
        {area.guide_md ? (
          <Markdown source={area.guide_md} />
        ) : (
          <p className="text-muted leading-relaxed">
            Our full guide to {area.name} is coming soon. In the meantime, browse the homes below or WhatsApp us — we know these streets well.
          </p>
        )}
      </div>
      <aside className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start" aria-label={`${area.name} at a glance`}>
        {hasMap ? <LocationReveal lat={area.latitude as number} lng={area.longitude as number} label={`${area.name}, Nairobi`} radius={1100} zoom={13.2} /> : null}
        {groups.length ? (
          <div className="flex flex-col gap-5 rounded-(--radius-card) border border-hairline bg-surface p-6">
            <p className="eyebrow flex items-center gap-2">
              <BuildingsIcon className="size-4" /> Nearby
            </p>
            {groups.map(({ c, items }) => {
              const IconCmp = NEARBY_ICONS[c];
              return (
                <div key={c} className="flex flex-col gap-2">
                  <p className="flex items-center gap-2 font-medium text-sm">
                    <IconCmp className="size-4 text-accent" /> {nearbyCategoryLabels[c]}
                  </p>
                  <ul className="flex flex-col gap-1 pl-6 text-muted text-sm">
                    {items.map((p) => (
                      <li key={p.name}>{p.name}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : null}
      </aside>
    </section>
  );
}

/** Factual FAQs built from live data (no invented claims). */
function buildFaqs(area: AreaDetail, stats: AreaSummary | null): { q: string; a: string }[] {
  const faqs: { q: string; a: string }[] = [];
  if (stats?.avgRentKes) {
    faqs.push({
      q: `How much does it cost to rent in ${area.name}?`,
      a: `Across the homes we currently have to let in ${area.name}, the average asking rent is about ${formatKES(Math.round(stats.avgRentKes / 1000) * 1000)} a month. Rent depends on size, finish and amenities — see the current rentals below.`,
    });
  }
  if (stats?.avgSaleKes) {
    faqs.push({
      q: `How much do homes cost to buy in ${area.name}?`,
      a: `Homes we currently have for sale in ${area.name} have an average asking price of about ${formatKES(Math.round(stats.avgSaleKes / 100_000) * 100_000)}. Prices vary widely by type and size, so browse the listings below or ask us for a shortlist.`,
    });
  }
  const places = NEARBY_PLACES[area.slug] ?? [];
  const schools = places.filter((p) => p.category === "school").map((p) => p.name);
  if (schools.length) {
    faqs.push({ q: `Which schools are near ${area.name}?`, a: `Schools near ${area.name} include ${schools.join(", ")}. Ask us about commute times for a specific home.` });
  }
  faqs.push({
    q: `How do I view a home in ${area.name}?`,
    a: `Open any listing and press “Book a viewing”, or WhatsApp us. We offer in-person viewings and live video-call viewings if you're abroad.`,
  });
  return faqs;
}
