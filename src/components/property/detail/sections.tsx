import {
  ArmchairIcon,
  BathtubIcon,
  BedIcon,
  CalendarDotsIcon,
  CarIcon,
  CheckIcon,
  CoinsIcon,
  DoorOpenIcon,
  FilePdfIcon,
  HammerIcon,
  HouseLineIcon,
  MoonIcon,
  RulerIcon,
  ToiletIcon,
  TreeIcon,
  UsersIcon,
  WalletIcon,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import type { ReactNode } from "react";
import { ClickToLoadEmbed } from "@/components/privacy/click-to-load-embed";
import { ClickToLoadFrame } from "@/components/privacy/click-to-load-frame";
import { cn } from "@/helpers/classname-helper";
import { formatKES } from "@/lib/format";
import { furnishingLabels, propertyTypeLabels } from "@/lib/labels";
import type { PropertyDetail } from "@/lib/queries/property-detail";
import { amenityLabel } from "@/lib/search/filters";
import { ReadMore } from "./read-more";

const num = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 });
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function DetailSection({
  id,
  eyebrow,
  title,
  children,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={cn("scroll-mt-28 border-hairline border-t pt-10", className)}>
      {eyebrow ? <p className="eyebrow mb-3 text-accent">{eyebrow}</p> : null}
      <h2 id={id ? `${id}-title` : undefined} className="mb-6 font-display text-[1.9rem] leading-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

// ---------- Key facts ----------

type Fact = { icon: ReactNode; label: string; value: string };

export function keyFacts(p: PropertyDetail): Fact[] {
  const facts: (Fact | null)[] = [
    { icon: <HouseLineIcon />, label: "Type", value: propertyTypeLabels[p.propertyType] },
    p.bedrooms !== null ? { icon: <BedIcon />, label: "Bedrooms", value: String(p.bedrooms) } : null,
    p.bathrooms !== null ? { icon: <BathtubIcon />, label: "Bathrooms", value: String(p.bathrooms) } : null,
    p.ensuites ? { icon: <ToiletIcon />, label: "En-suites", value: String(p.ensuites) } : null,
    p.propertyType !== "land" ? { icon: <DoorOpenIcon />, label: "DSQ", value: p.dsq ? "Yes" : "No" } : null,
    p.parking !== null ? { icon: <CarIcon />, label: "Parking", value: `${p.parking} space${p.parking === 1 ? "" : "s"}` } : null,
    p.floorArea ? { icon: <RulerIcon />, label: "Floor area", value: `${num.format(p.floorArea)} m²` } : null,
    p.landAcres ? { icon: <TreeIcon />, label: "Land", value: `${num.format(p.landAcres)} acre${p.landAcres === 1 ? "" : "s"}` } : null,
    p.furnishing ? { icon: <ArmchairIcon />, label: "Furnishing", value: furnishingLabels[p.furnishing] } : null,
    p.serviceChargeKes ? { icon: <CoinsIcon />, label: "Service charge", value: `${formatKES(p.serviceChargeKes)}/mo` } : null,
    p.depositMonths && p.listingType === "rent"
      ? { icon: <WalletIcon />, label: "Deposit", value: `${num.format(p.depositMonths)} month${p.depositMonths === 1 ? "" : "s"}` }
      : null,
    p.listingType !== "short_stay" && (p.availableFrom || p.listingType === "rent")
      ? {
          icon: <CalendarDotsIcon />,
          label: "Available",
          value: p.availableNow || !p.availableFrom ? "Now" : dateFmt.format(new Date(`${p.availableFrom}T12:00:00Z`)),
        }
      : null,
    p.yearBuilt ? { icon: <HammerIcon />, label: "Year built", value: String(p.yearBuilt) } : null,
    p.maxGuests ? { icon: <UsersIcon />, label: "Guests", value: `Up to ${p.maxGuests}` } : null,
    p.minNights && p.listingType === "short_stay"
      ? { icon: <MoonIcon />, label: "Minimum stay", value: `${p.minNights} night${p.minNights === 1 ? "" : "s"}` }
      : null,
    // Check-in/out times live in "Things to know" next to the house rules.
  ];
  return facts.filter((f): f is Fact => f !== null);
}

export function KeyFacts({ facts }: { facts: Fact[] }) {
  return (
    <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {facts.map((f) => (
        <div
          key={f.label}
          // dt/dd must be direct children of this div (valid <dl> grouping); the icon sits in its own column.
          className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 rounded-2xl border border-hairline bg-surface p-4 [&_svg]:size-6 [&_svg]:shrink-0 [&_svg]:text-accent"
        >
          <span aria-hidden="true" className="row-span-2">
            {f.icon}
          </span>
          <dt className="text-muted text-xs">{f.label}</dt>
          <dd className="truncate font-medium">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ---------- Description ----------

/** Minimal, safe rendering of staff text: paragraphs, "- " bullet lists and **bold**. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  );
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className={cn("flex flex-col gap-4 text-[1.02rem] text-foreground/85 leading-relaxed", className)}>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
          return (
            <ul key={i} className="flex list-disc flex-col gap-1.5 pl-5 marker:text-accent">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*[-*•]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        if (/^#{1,4}\s/.test(block)) {
          return (
            <h3 key={i} className="font-display text-foreground text-xl">
              {block.replace(/^#{1,4}\s/, "")}
            </h3>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <span key={j}>
                {j > 0 ? <br /> : null}
                {inline(l)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export function Description({ text, summary }: { text: string | null; summary: string | null }) {
  const body = text ?? summary;
  if (!body) return null;
  return (
    <DetailSection id="about" eyebrow="About this home" title="The details">
      <ReadMore>
        <RichText text={body} />
      </ReadMore>
    </DetailSection>
  );
}

// ---------- Amenities ----------

export function Amenities({ amenities }: { amenities: string[] }) {
  if (!amenities.length) return null;
  return (
    <DetailSection id="amenities" eyebrow="Features" title="Amenities">
      <ul className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {amenities.map((a) => (
          <li key={a} className="flex items-center gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-green-600/12 text-green-700 dark:text-green-400">
              <CheckIcon weight="bold" className="size-4" aria-hidden="true" />
            </span>
            {amenityLabel(a)}
          </li>
        ))}
      </ul>
    </DetailSection>
  );
}

// ---------- Video, 3D tour, floor plans, documents ----------

export function MediaSection({ p }: { p: PropertyDetail }) {
  const [main, ...more] = p.videos;
  const cover = p.images[0]?.src ?? null;
  const hasAny = main || p.virtualTourUrl || p.floorPlans.length || p.documents.length;
  if (!hasAny) return null;

  return (
    <>
      {main || p.virtualTourUrl ? (
        <DetailSection id="tour" eyebrow="Tour it from anywhere" title={main ? "Video tour" : "3D tour"}>
          <div className="flex flex-col gap-5">
            {main ? <ClickToLoadEmbed url={main.url} title={main.title} /> : null}
            {more.length ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {more.map((v) => (
                  <ClickToLoadEmbed key={v.url} url={v.url} title={v.title} className="mx-auto" />
                ))}
              </div>
            ) : null}
            {p.virtualTourUrl ? <ClickToLoadFrame url={p.virtualTourUrl} title={`3D tour: ${p.title}`} poster={cover} /> : null}
          </div>
        </DetailSection>
      ) : null}

      {p.floorPlans.length || p.documents.length ? (
        <DetailSection id="floor-plan" eyebrow="Plans & documents" title={p.floorPlans.length ? "Floor plan" : "Documents"}>
          <div className="flex flex-col gap-5">
            {p.floorPlans.map((plan) => (
              <a
                key={plan.src}
                href={plan.src}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block overflow-hidden rounded-(--radius-card) border border-hairline bg-ivory"
                aria-label={`${plan.alt} (opens full size in a new tab)`}
              >
                <Image
                  src={plan.src}
                  alt={plan.alt}
                  width={plan.width}
                  height={plan.height}
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="h-auto w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.01]"
                />
              </a>
            ))}
            {p.documents.length ? (
              <ul className="flex flex-wrap gap-3">
                {p.documents.map((d) => (
                  <li key={d.url}>
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex h-12 items-center gap-2.5 rounded-full border border-border px-5 font-medium text-sm transition-colors hover:border-gold-600 hover:text-accent [&_svg]:size-5 [&_svg]:text-accent"
                    >
                      <FilePdfIcon aria-hidden="true" />
                      Download {d.label.toLowerCase().startsWith("download") ? d.label.slice(9) : d.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </DetailSection>
      ) : null}
    </>
  );
}

