import { BathtubIcon, BedIcon, MapPinIcon, RulerIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { HydrateWhenVisible } from "@/components/motion/hydrate-when-visible";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { NEARBY_PLACES, nearbyCategoryLabels, type NearbyCategory } from "@/content/nearby-places";
import { listingTypeLabels, listingTypeRoutes, propertyTypeLabels, statusRibbons } from "@/lib/labels";
import type { PropertyCardData } from "@/lib/queries/properties";
import type { PropertyDetail } from "@/lib/queries/property-detail";
import { formatClockTime } from "@/lib/dates";
import type { StayInfo } from "@/lib/short-stay/stay";
import { listingJsonLd, listingSectionLabel } from "@/lib/seo/listing";
import { Gallery } from "./gallery";
import { ListingRail } from "./listing-rail";
import { LocationReveal } from "./location-reveal";
import { MortgageCalculator, RentAffordability } from "./mortgage-calculator";
import { ListingMobileBar, PricePanel, PriceTag } from "./price-panel";
import { RecentlyViewed } from "./recently-viewed";
import { Amenities, Description, DetailSection, KeyFacts, keyFacts, MediaSection, RichText } from "./sections";
import { ViewTracker } from "./view-tracker";
import { ViewingProvider } from "./viewing-context";
import { StayBooking } from "./stay/stay-booking";
import { BOOKING_SECTION_ID, StayProvider } from "./stay/stay-context";
import { StayMobileBar, StayPanel } from "./stay/stay-panel";

const SIMILAR_TITLES: Record<PropertyDetail["listingType"], string> = {
  sale: "Similar homes for sale",
  rent: "Similar rentals",
  short_stay: "More short stays",
};

const num = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 });

/**
 * Listing detail page body, shared by /properties/[slug] and
 * /short-stays/[slug]. Everything here is cached, public data; the
 * interactive islands (gallery, price panel, forms, maps) are client components.
 */
export function PropertyPage({
  property: p,
  similar,
  stay,
  preview = false,
}: {
  property: PropertyDetail;
  similar: PropertyCardData[];
  /** Short stays: availability and pricing for the booking widget. */
  stay?: StayInfo;
  /** Staff preview (/preview/[id]): no view counting, no "recently viewed". */
  preview?: boolean;
}) {
  const ribbon = statusRibbons[p.status];
  const closed = p.status === "sold" || p.status === "let";
  // Short stays book through the stay widget; the viewing dialog only takes questions there.
  const isStay = p.listingType === "short_stay" && !!stay && !closed;
  const intent = closed || p.listingType === "short_stay" ? "enquiry" : "viewing";
  const nearby = p.area ? (NEARBY_PLACES[p.area.slug] ?? []) : [];
  const price = {
    priceKes: p.priceKes,
    pricePeriod: p.pricePeriod,
    priceOnRequest: p.priceOnRequest,
    serviceChargeKes: p.serviceChargeKes,
    depositMonths: p.depositMonths,
  };

  const page = (
    <ViewingProvider
      listing={{
        id: p.id,
        title: p.title,
        refCode: p.refCode,
        href: p.href,
        areaName: p.area?.name ?? null,
        agentName: p.agent?.name ?? null,
        intent,
      }}
    >
      <JsonLd data={listingJsonLd(p)} />
      {preview ? null : <ViewTracker slug={p.slug} />}

      <article className="mx-auto flex w-full max-w-[90rem] flex-col gap-8 px-4 pt-6 pb-32 sm:px-6 md:pb-24 lg:px-10">
        <Breadcrumbs p={p} />

        <Gallery
          propertyId={p.id}
          title={p.title}
          images={p.images}
          hasVideo={p.videos.length > 0 || !!p.virtualTourUrl}
          hasFloorPlan={p.floorPlans.length > 0 || p.documents.length > 0}
          ribbon={ribbon}
          badges={
            <>
              {p.isNew ? <Badge variant="green" size="sm">New this week</Badge> : null}
              {p.isFeatured ? <Badge variant="glass" size="sm">Featured</Badge> : null}
              {p.priceDrop ? <Badge variant="danger" size="sm">Price drop</Badge> : null}
            </>
          }
        />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_25rem]">
          <div className="flex min-w-0 flex-col gap-10">
            <header className="flex flex-col gap-4">
              <p className="eyebrow text-accent">
                {listingTypeLabels[p.listingType]} · {propertyTypeLabels[p.propertyType]}
                {p.refCode ? <span className="ml-2 font-mono text-muted tracking-widest">{p.refCode}</span> : null}
              </p>
              <h1 className="text-[clamp(2.1rem,4.6vw,3.6rem)] leading-[1.02]">{p.title}</h1>
              {p.area || p.address ? (
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted">
                  <MapPinIcon aria-hidden="true" className="size-5 shrink-0 text-accent" />
                  <span>{p.address ?? `${p.area?.name}, Nairobi`}</span>
                  {p.area ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <Link href={`/areas/${p.area.slug}`} className="text-accent underline-offset-4 hover:underline">
                        {p.area.name} area guide
                      </Link>
                    </>
                  ) : null}
                </p>
              ) : null}
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-foreground/85 [&_svg]:size-5 [&_svg]:text-accent">
                {p.bedrooms ? <QuickFact icon={<BedIcon />}>{p.bedrooms} bed{p.bedrooms === 1 ? "" : "s"}</QuickFact> : null}
                {p.bathrooms ? <QuickFact icon={<BathtubIcon />}>{p.bathrooms} bath{p.bathrooms === 1 ? "" : "s"}</QuickFact> : null}
                {p.floorArea ? <QuickFact icon={<RulerIcon />}>{num.format(p.floorArea)} m²</QuickFact> : null}
              </ul>
              {/* On phones the price lives here; the sticky panel takes over from lg. */}
              <PriceTag price={price} className="mt-2 lg:hidden" />
              {p.summary ? <p className="max-w-3xl text-foreground/80 text-lg leading-relaxed">{p.summary}</p> : null}
            </header>

            <section aria-label="Key facts">
              <KeyFacts facts={keyFacts(p)} />
            </section>

            {/* Lower blocks hydrate as they approach the viewport (HydrateWhenVisible); their HTML
                is visible immediately. */}
            <HydrateWhenVisible className="flex flex-col gap-10 empty:hidden">
              <Description text={p.description} summary={null} />
              <Amenities amenities={p.amenities} />
            </HydrateWhenVisible>

            {isStay ? (
              <DetailSection id={BOOKING_SECTION_ID} eyebrow="Availability" title="Choose your dates">
                <StayBooking />
              </DetailSection>
            ) : null}

            {p.listingType === "short_stay" ? <ThingsToKnow p={p} /> : null}

            <HydrateWhenVisible className="flex flex-col gap-10 empty:hidden">
              <MediaSection p={p} />
            </HydrateWhenVisible>

            <HydrateWhenVisible className="flex flex-col gap-10 empty:hidden">
            {p.location || nearby.length ? (
              <DetailSection id="location" eyebrow="Neighbourhood" title={p.area ? `Living in ${p.area.name}` : "Location"}>
                <div className="flex flex-col gap-6">
                  {p.location ? (
                    <LocationReveal lat={p.location.lat} lng={p.location.lng} label={p.area ? `${p.area.name}, Nairobi` : "Nairobi"} />
                  ) : null}
                  <p className="text-muted text-sm">
                    The map shows the approximate area. We share the exact address when your viewing is confirmed.
                  </p>
                  {nearby.length ? <NearbyList places={nearby} /> : null}
                </div>
              </DetailSection>
            ) : null}

            {p.listingType === "sale" && p.priceKes && !p.priceOnRequest && !closed ? (
              <DetailSection id="finance" eyebrow="Plan your purchase" title="Mortgage calculator">
                <MortgageCalculator priceKes={p.priceKes} />
              </DetailSection>
            ) : null}
            {p.listingType === "rent" && p.priceKes && !p.priceOnRequest && !closed ? (
              <DetailSection id="finance" eyebrow="Plan your move" title="Move-in costs">
                <RentAffordability rentKes={p.priceKes} depositMonths={p.depositMonths} serviceChargeKes={p.serviceChargeKes} />
              </DetailSection>
            ) : null}
            </HydrateWhenVisible>
          </div>

          <aside aria-label="Price and contact" className="lg:order-none">
            <div className="lg:sticky lg:top-28">
              {isStay ? (
                <StayPanel price={price} agent={p.agent} />
              ) : (
                <PricePanel
                  id={p.id}
                  title={p.title}
                  refCode={p.refCode}
                  href={p.href}
                  price={price}
                  agent={p.agent}
                  ribbon={closed ? ribbon : undefined}
                />
              )}
            </div>
          </aside>
        </div>

        <HydrateWhenVisible>
        <div className="mt-8 flex flex-col gap-16">
          <ListingRail
            id="similar"
            eyebrow="You may also like"
            title={SIMILAR_TITLES[p.listingType]}
            items={similar}
          />
          {preview ? null : <RecentlyViewed currentId={p.id} />}
        </div>
        </HydrateWhenVisible>
      </article>

      {isStay ? <StayMobileBar /> : <ListingMobileBar title={p.title} refCode={p.refCode} href={p.href} agent={p.agent} />}
    </ViewingProvider>
  );

  if (!isStay || !stay) return page;
  return (
    <StayProvider
      stay={stay}
      listing={{
        id: p.id,
        title: p.title,
        refCode: p.refCode,
        href: p.href,
        areaName: p.area?.name ?? null,
        agentName: p.agent?.name ?? null,
        agentPhone: p.agent?.phone ?? null,
        agentWhatsapp: p.agent?.whatsapp ?? null,
      }}
    >
      {page}
    </StayProvider>
  );
}

/** Short stays: check-in/out times, guests, minimum stay and the house rules. */
function ThingsToKnow({ p }: { p: PropertyDetail }) {
  const facts = [
    p.checkInTime ? { label: "Check-in", value: `From ${formatClockTime(p.checkInTime)}` } : null,
    p.checkOutTime ? { label: "Check-out", value: `By ${formatClockTime(p.checkOutTime)}` } : null,
    p.maxGuests ? { label: "Guests", value: `Up to ${p.maxGuests}` } : null,
    p.minNights ? { label: "Minimum stay", value: `${p.minNights} night${p.minNights === 1 ? "" : "s"}` } : null,
  ].filter((f): f is { label: string; value: string } => f !== null);
  if (!facts.length && !p.houseRules) return null;

  return (
    <DetailSection id="house-rules" eyebrow="Before you book" title="Things to know">
      <div className="flex flex-col gap-6">
        {facts.length ? (
          <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label} className="rounded-2xl border border-hairline bg-surface p-4">
                <dt className="text-muted text-xs">{f.label}</dt>
                <dd className="font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {p.houseRules ? (
          <div className="flex flex-col gap-3">
            <h3 className="eyebrow text-muted">House rules</h3>
            <RichText text={p.houseRules} />
          </div>
        ) : null}
      </div>
    </DetailSection>
  );
}

function QuickFact({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden="true">{icon}</span>
      {children}
    </li>
  );
}

function Breadcrumbs({ p }: { p: PropertyDetail }) {
  return (
    <nav aria-label="Breadcrumb" className="text-muted text-xs">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link href={listingTypeRoutes[p.listingType]} className="hover:text-foreground">
            {listingSectionLabel[p.listingType]}
          </Link>
        </li>
        {p.area ? (
          <>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`${listingTypeRoutes[p.listingType]}?area=${p.area.slug}`} className="hover:text-foreground">
                {p.area.name}
              </Link>
            </li>
          </>
        ) : null}
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="max-w-[60vw] truncate text-foreground/80">
          {p.title}
        </li>
      </ol>
    </nav>
  );
}

const CATEGORY_ORDER: NearbyCategory[] = ["school", "health", "shopping"];

function NearbyList({ places }: { places: { name: string; category: NearbyCategory }[] }) {
  const groups = CATEGORY_ORDER.map((c) => ({ c, items: places.filter((p) => p.category === c) })).filter((g) => g.items.length);
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {groups.map(({ c, items }) => (
        <div key={c} className="flex flex-col gap-2">
          <p className="eyebrow text-muted">{nearbyCategoryLabels[c]}</p>
          <ul className="flex flex-col gap-1.5 text-sm">
            {items.map((i) => (
              <li key={i.name}>{i.name}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
