"use client";

import { ArrowLeftIcon, ArrowRightIcon, QuotesIcon, StarIcon } from "@phosphor-icons/react";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/helpers/classname-helper";
import type { Testimonial } from "@/lib/queries/content";

/** Testimonials carousel: autoplay pauses on hover/focus; off under reduced motion. */
export function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const reduce = useReducedMotion();
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: testimonials.length > 2, align: "start", duration: 28 },
    reduce ? [] : [Autoplay({ delay: 6000, stopOnMouseEnter: true, stopOnInteraction: false, stopOnFocusIn: true })],
  );
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (!emblaApi) return;
    const onInit = () => setSnaps(emblaApi.scrollSnapList());
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onInit();
    onSelect();
    emblaApi.on("reInit", onInit).on("reInit", onSelect).on("select", onSelect);
    return () => {
      emblaApi.off("reInit", onInit).off("reInit", onSelect).off("select", onSelect);
    };
  }, [emblaApi]);

  if (testimonials.length === 0) return null;

  return (
    <section aria-labelledby="testimonials-title" className="bg-surface-2/50 py-24 lg:py-32">
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-10">
        <SectionHeading
          id="testimonials-title"
          eyebrow="Kind words"
          title="What our clients say"
          action={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => emblaApi?.scrollPrev()}
                aria-label="Previous testimonial"
                className="grid size-11 place-items-center rounded-full border border-hairline transition-colors hover:border-gold-600 hover:text-accent"
              >
                <ArrowLeftIcon className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => emblaApi?.scrollNext()}
                aria-label="Next testimonial"
                className="grid size-11 place-items-center rounded-full border border-hairline transition-colors hover:border-gold-600 hover:text-accent"
              >
                <ArrowRightIcon className="size-5" />
              </button>
            </div>
          }
        />

        <div ref={emblaRef} className="mt-12 overflow-hidden" aria-roledescription="carousel" aria-label="Client testimonials">
          <ul className="-ml-5 flex touch-pan-y">
            {testimonials.map((t, i) => (
              <li
                key={t.id}
                className="min-w-0 flex-[0_0_100%] pl-5 md:flex-[0_0_50%] xl:flex-[0_0_33.333%]"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${testimonials.length}`}
              >
                <figure className="flex h-full flex-col gap-6 rounded-(--radius-card) border border-hairline bg-surface p-7 shadow-soft sm:p-8">
                  <div className="flex items-center justify-between">
                    <QuotesIcon weight="fill" aria-hidden="true" className="size-8 text-gold-600/70 dark:text-gold/60" />
                    {t.rating ? (
                      <div className="flex gap-0.5" role="img" aria-label={`${t.rating} out of 5 stars`}>
                        {Array.from({ length: 5 }, (_, s) => (
                          <StarIcon
                            key={s}
                            weight="fill"
                            aria-hidden="true"
                            className={cn("size-4", s < (t.rating ?? 0) ? "text-gold-500" : "text-foreground/15")}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <blockquote className="flex-1 font-display text-[1.35rem] leading-snug">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="flex items-center gap-3 border-hairline border-t pt-5">
                    <span
                      aria-hidden="true"
                      className="grid size-11 place-items-center rounded-full bg-gold-400/15 font-display text-accent"
                    >
                      {t.author
                        .split(/\s+/)
                        .map((w) => w[0])
                        .filter((c) => c && /[A-Za-z]/.test(c))
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <span className="flex flex-col">
                      <span className="font-medium text-sm">{t.author}</span>
                      {t.role ? <span className="text-muted text-xs">{t.role}</span> : null}
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>

        {snaps.length > 1 ? (
          <div className="mt-8 flex justify-center gap-0.5">
            {snaps.map((_, i) => (
              <button
                key={`snap-${i}`}
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                aria-current={i === selected ? "true" : undefined}
                // 24px tap target (WCAG 2.5.8); the visible dot is the inner span.
                className="group/dot grid h-6 min-w-6 place-items-center px-1"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "block h-1.5 rounded-full transition-[width,background-color] duration-300 ease-(--ease-out-brand)",
                    i === selected ? "w-6 bg-gold-600 dark:bg-gold" : "w-1.5 bg-foreground/20 group-hover/dot:bg-foreground/40",
                  )}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
