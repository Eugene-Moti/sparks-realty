"use client";

import {
  BathtubIcon,
  BedIcon,
  CarIcon,
  CaretLeftIcon,
  CaretRightIcon,
  MapPinIcon,
  PlayIcon,
  RulerIcon,
  ScalesIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { type MouseEvent, type ReactNode, useCallback, useEffect, useRef, useState, ViewTransition } from "react";
import { ClickToLoadEmbed } from "@/components/privacy/click-to-load-embed";
import { useContact } from "@/components/providers/contact-provider";
import { useCurrency } from "@/components/providers/currency-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { absoluteUrl } from "@/config/site";
import { cn } from "@/helpers/classname-helper";
import { listingWhatsAppLink } from "@/lib/format";
import { propertyTypeLabels, statusRibbons } from "@/lib/labels";
import type { PropertyCardData } from "@/lib/queries/properties";
import { useCompare } from "@/lib/stores/compare";
import { FavouriteButton } from "./favourite-button";

type PropertyCardProps = {
  property: PropertyCardData;
  className?: string;
  /** Load the first image eagerly (above-the-fold cards). */
  priority?: boolean;
  /** Card width hint for next/image. */
  sizes?: string;
  /** Swipeable photo carousel; off in the mobile card hand (the whole card swipes). */
  carousel?: boolean;
  /** "list" puts the photo beside the details from md up (search results list view). */
  layout?: "grid" | "list";
  /**
   * Morph the cover photo into the listing hero on navigation. Turn off where
   * the same listing can render twice at once (e.g. the mobile card hand).
   */
  sharedTransition?: boolean;
};

const numberFmt = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 });

export function PropertyCard({
  property: p,
  className,
  priority,
  sizes = "(min-width: 1280px) 400px, (min-width: 768px) 45vw, 92vw",
  carousel = true,
  layout = "grid",
  sharedTransition = true,
}: PropertyCardProps) {
  const isList = layout === "list";
  const { format } = useCurrency();
  const { whatsapp } = useContact();
  const [videoOpen, setVideoOpen] = useState(false);
  const price = format({ priceKes: p.priceKes, period: p.pricePeriod, priceOnRequest: p.priceOnRequest });
  const ribbon = statusRibbons[p.status];
  const typeLabel = propertyTypeLabels[p.propertyType];

  return (
    <article
      className={cn(
        "group/card relative flex flex-col overflow-hidden rounded-(--radius-card) border border-hairline bg-surface shadow-soft",
        "transition-[box-shadow,transform] duration-500 ease-(--ease-out-brand) hover:-translate-y-1 hover:shadow-lift",
        isList && "md:flex-row",
        className,
      )}
    >
      {/* ---------- Media ---------- */}
      <div
        className={cn(
          "relative aspect-4/3 overflow-hidden bg-ink-3",
          isList && "md:aspect-auto md:min-h-72 md:w-[42%] md:shrink-0",
        )}
      >
        <CardCarousel
          images={carousel ? p.images : p.images.slice(0, 1)}
          href={p.href}
          title={p.title}
          transitionName={sharedTransition ? photoTransitionName(p.id) : undefined}
          priority={priority}
          sizes={isList ? "(min-width: 768px) 40vw, 92vw" : sizes}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <div className="flex flex-wrap gap-1.5">
            {p.isNew ? <Badge variant="green" size="sm">New this week</Badge> : null}
            {p.isFeatured ? <Badge variant="glass" size="sm">Featured</Badge> : null}
            {p.priceDrop ? <Badge variant="danger" size="sm">Price drop</Badge> : null}
            {p.listingType === "short_stay" ? <Badge variant="glass" size="sm">Short stay</Badge> : null}
          </div>
          <FavouriteButton id={p.id} title={p.title} className="pointer-events-auto shrink-0" />
        </div>

        {ribbon ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-ink/75 py-2 text-center font-medium text-[0.7rem] text-ivory uppercase tracking-[0.3em] backdrop-blur-sm">
            {ribbon}
          </div>
        ) : null}

        {p.youtubeUrl ? (
          <button
            type="button"
            onClick={() => setVideoOpen(true)}
            className={cn(
              "absolute left-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-ink/60 pr-3 pl-1.5 font-medium text-ivory text-xs backdrop-blur-md transition-colors hover:bg-ink/80",
              ribbon ? "bottom-11" : "bottom-3",
            )}
            aria-label={`Watch the video tour of ${p.title}`}
          >
            <span className="grid size-5.5 place-items-center rounded-full bg-gold text-ink">
              <PlayIcon weight="fill" className="size-3" />
            </span>
            Video tour
          </button>
        ) : null}
      </div>

      {/* ---------- Body ---------- */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <p className="font-medium font-mono text-[1.05rem] text-foreground tracking-tight">{price.primary}</p>
          {price.secondary ? <p className="font-mono text-muted text-xs">{price.secondary}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="line-clamp-2 font-display text-[1.3rem] leading-snug">
            <Link href={p.href} className="transition-colors hover:text-accent">
              {p.title}
            </Link>
          </h3>
          {p.areaName || p.address ? (
            <p className="flex items-center gap-1.5 text-muted text-sm">
              <MapPinIcon aria-hidden="true" className="size-4 shrink-0 text-accent" />
              <span className="truncate">{[p.areaName, p.address].filter(Boolean).join(" · ")}</span>
            </p>
          ) : null}
        </div>

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 border-hairline border-y py-3 text-foreground/85 text-sm">
          {p.bedrooms ? <Fact icon={<BedIcon />} label={`${p.bedrooms} bed${p.bedrooms > 1 ? "s" : ""}`} /> : null}
          {p.bathrooms ? <Fact icon={<BathtubIcon />} label={`${p.bathrooms} bath${p.bathrooms > 1 ? "s" : ""}`} /> : null}
          {p.parking ? <Fact icon={<CarIcon />} label={`${p.parking} parking`} /> : null}
          {p.floorArea ? <Fact icon={<RulerIcon />} label={`${numberFmt.format(p.floorArea)} m²`} /> : null}
        </ul>

        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-muted">{typeLabel}</span>
          <div className="flex items-center gap-3">
            {p.refCode ? <span className="font-mono text-muted tracking-wider">{p.refCode}</span> : null}
            <CompareToggle id={p.id} title={p.title} />
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
          <Button asChild variant="gold-outline" size="md" className="px-3">
            <Link href={p.href}>View details</Link>
          </Button>
          <Button asChild variant="green-solid" size="md" className="px-3">
            <a
              href={listingWhatsAppLink({ title: p.title, refCode: p.refCode, url: absoluteUrl(p.href) }, whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ask about ${p.title} on WhatsApp (opens in a new tab)`}
            >
              <WhatsappLogoIcon weight="fill" /> WhatsApp
            </a>
          </Button>
        </div>
      </div>

      {p.youtubeUrl ? (
        <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
          <DialogContent className="max-w-4xl bg-ink p-3 text-ivory sm:p-4" aria-describedby={undefined}>
            <DialogTitle className="sr-only">Video tour: {p.title}</DialogTitle>
            {videoOpen ? <ClickToLoadEmbed url={p.youtubeUrl} title={p.title} autoLoad className="mx-auto" /> : null}
          </DialogContent>
        </Dialog>
      ) : null}
    </article>
  );
}

function Fact({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-1.5 [&_svg]:size-4.5 [&_svg]:text-accent">
      <span aria-hidden="true">{icon}</span>
      {label}
    </li>
  );
}

function CompareToggle({ id, title }: { id: string; title: string }) {
  const { has, toggle, full } = useCompare();
  const active = has(id);
  const disabled = full && !active;
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={() => toggle(id)}
      title={disabled ? "You can compare up to 3 homes" : undefined}
      aria-label={active ? `Remove ${title} from compare` : `Add ${title} to compare`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 font-medium transition-colors",
        active ? "border-gold-600 bg-gold-400/12 text-accent" : "border-border text-muted hover:text-foreground",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      <ScalesIcon className="size-3.5" aria-hidden="true" />
      {active ? "Comparing" : "Compare"}
    </button>
  );
}

// ---------- In-card image carousel ----------

/** Shared name for the card cover ↔ detail hero morph. */
export const photoTransitionName = (id: string) => `sp-photo-${id}`;

/** Wraps the cover image so React can morph it into the detail hero. */
export function PhotoTransition({ name, children }: { name?: string; children: ReactNode }) {
  if (!name) return children;
  return (
    <ViewTransition name={name} share="sp-morph" default="none">
      {children}
    </ViewTransition>
  );
}

function CardCarousel({
  images,
  href,
  title,
  priority,
  sizes,
  transitionName,
}: {
  images: PropertyCardData["images"];
  href: string;
  title: string;
  priority?: boolean;
  sizes: string;
  transitionName?: string;
}) {
  // Only the cover loads up front; the rest load once the visitor shows interest.
  const [engaged, setEngaged] = useState(false);
  // Start Embla in idle time once the card is on/near screen — not during page start-up
  // (a grid of cards each measuring the DOM at hydration adds up on phones).
  const [ready, setReady] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: images.length > 1, duration: 22, active: ready || engaged });
  const [index, setIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      emblaRef(node);
    },
    [emblaRef],
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el || ready) return;
    let idleId: number | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const start = () => setReady(true);
        idleId = "requestIdleCallback" in window ? window.requestIdleCallback(start, { timeout: 2000 }) : (globalThis.setTimeout(start, 300) as unknown as number);
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (idleId === undefined) return;
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
      else globalThis.clearTimeout(idleId);
    };
  }, [ready]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setIndex(emblaApi.selectedScrollSnap());
    const onEngage = () => setEngaged(true);
    emblaApi.on("select", onSelect).on("pointerDown", onEngage);
    return () => {
      emblaApi.off("select", onSelect).off("pointerDown", onEngage);
    };
  }, [emblaApi]);

  const go = useCallback(
    (dir: -1 | 1) => (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setEngaged(true);
      if (dir < 0) emblaApi?.scrollPrev();
      else emblaApi?.scrollNext();
    },
    [emblaApi],
  );

  if (images.length === 0) {
    return (
      <Link href={href} className="absolute inset-0 grid place-items-center" aria-label={title}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/mark.svg" alt="" className="size-20 opacity-25" />
      </Link>
    );
  }

  if (images.length === 1) {
    const img = images[0];
    return (
      <>
        <Link href={href} aria-label={title} className="absolute inset-0" draggable={false}>
          <PhotoTransition name={transitionName}>
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes={sizes}
            priority={priority}
            placeholder={img.blurDataURL ? "blur" : "empty"}
            blurDataURL={img.blurDataURL ?? undefined}
            draggable={false}
            className="object-cover transition-transform duration-700 ease-(--ease-out-brand) group-hover/card:scale-[1.04]"
          />
          </PhotoTransition>
        </Link>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-b from-ink/35 via-transparent to-ink/30" />
      </>
    );
  }

  return (
    <>
      <div
        ref={setRefs}
        className="absolute inset-0 overflow-hidden"
        aria-roledescription="carousel"
        aria-label={`Photos of ${title}`}
        onPointerEnter={() => setEngaged(true)}
        onFocus={() => setEngaged(true)}
      >
        <div className="flex h-full touch-pan-y">
          {images.map((img, i) => (
            <Link
              key={img.src + i}
              href={href}
              tabIndex={i === 0 ? 0 : -1}
              aria-label={i === 0 ? title : undefined}
              aria-hidden={i === 0 ? undefined : true}
              // Embla v8 suppresses the click that ends a drag, so swiping never navigates.
              className="relative h-full min-w-0 flex-[0_0_100%]"
              draggable={false}
            >
              {i === 0 || engaged ? (
                <PhotoTransition name={i === 0 ? transitionName : undefined}>
                <Image
                  src={img.src}
                  alt={i === 0 ? img.alt : ""}
                  fill
                  sizes={sizes}
                  priority={priority && i === 0}
                  placeholder={img.blurDataURL ? "blur" : "empty"}
                  blurDataURL={img.blurDataURL ?? undefined}
                  draggable={false}
                  className="object-cover transition-transform duration-700 ease-(--ease-out-brand) group-hover/card:scale-[1.04]"
                />
                </PhotoTransition>
              ) : null}
            </Link>
          ))}
        </div>
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-b from-ink/35 via-transparent to-ink/30" />

      {images.length > 1 ? (
        <>
          <button
            type="button"
            onClick={go(-1)}
            aria-label="Previous photo"
            className="absolute top-1/2 left-3 hidden size-9 -translate-y-1/2 place-items-center rounded-full bg-ivory/90 text-ink opacity-0 shadow-soft transition-opacity duration-200 hover:bg-ivory focus-visible:opacity-100 group-hover/card:opacity-100 sm:grid"
          >
            <CaretLeftIcon weight="bold" className="size-4" />
          </button>
          <button
            type="button"
            onClick={go(1)}
            aria-label="Next photo"
            className="absolute top-1/2 right-3 hidden size-9 -translate-y-1/2 place-items-center rounded-full bg-ivory/90 text-ink opacity-0 shadow-soft transition-opacity duration-200 hover:bg-ivory focus-visible:opacity-100 group-hover/card:opacity-100 sm:grid"
          >
            <CaretRightIcon weight="bold" className="size-4" />
          </button>
          <div aria-hidden="true" className="pointer-events-none absolute right-0 bottom-3 left-0 flex justify-center gap-1">
            {images.map((img, i) => (
              <span
                key={img.src + i}
                className={cn(
                  "h-1.5 rounded-full bg-ivory/55 transition-[width,background-color] duration-300 ease-(--ease-out-brand)",
                  i === index ? "w-4 bg-ivory" : "w-1.5",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}

/** Loading placeholder with the same footprint as a card. */
export function PropertyCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex flex-col overflow-hidden rounded-(--radius-card) border border-hairline bg-surface", className)}
      aria-hidden="true"
    >
      <Skeleton className="aspect-4/3 rounded-none" />
      <div className="flex flex-col gap-4 p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <div className="flex gap-4 border-hairline border-y py-3">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-11 rounded-full" />
          <Skeleton className="h-11 rounded-full" />
        </div>
      </div>
    </div>
  );
}
