"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/helpers/classname-helper";
import { formatCompact } from "@/lib/format";
import type { AreaSummary } from "@/lib/queries/areas";

/**
 * Desktop: a sticky section whose row of area cards scrolls sideways as you
 * scroll down, with a cursor-following "Explore {area}" preview.
 * Phones / reduced motion: a normal swipeable row.
 */
export function AreasStrip({ areas }: { areas: AreaSummary[] }) {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const [distance, setDistance] = useState(0);
  const [desktop, setDesktop] = useState(false);
  const sticky = desktop && !reduce && distance > 0;

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px) and (hover: hover)");
    const update = () => setDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => setDistance(Math.max(0, track.scrollWidth - window.innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);

  // Cursor-follow preview
  const cx = useMotionValue(0);
  const cy = useMotionValue(0);
  const sx = useSpring(cx, { stiffness: 350, damping: 30, mass: 0.5 });
  const sy = useSpring(cy, { stiffness: 350, damping: 30, mass: 0.5 });
  const [hovered, setHovered] = useState<AreaSummary | null>(null);

  if (areas.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="areas-title"
      className="dark relative bg-ink text-ivory"
      style={sticky ? { height: `calc(100vh + ${distance}px)` } : undefined}
    >
      <div className={cn("grain flex flex-col justify-center overflow-hidden py-24", sticky && "sticky top-0 h-screen py-0")}>
        <div className="relative z-10 mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-10">
          <SectionHeading
            id="areas-title"
            eyebrow="Neighbourhoods"
            title="Know the area before you view"
            description="Honest guides to the parts of Nairobi we know best — prices, schools, commute and the coffee worth crossing town for."
            action={
              <Link href="/areas" className="inline-flex items-center gap-2 font-medium text-gold text-sm hover:text-gold-light">
                All area guides <ArrowUpRightIcon className="size-4" />
              </Link>
            }
          />
        </div>

        <motion.ul
          ref={trackRef}
          style={sticky ? { x } : undefined}
          className={cn(
            "relative z-10 mt-12 flex gap-5 px-4 sm:px-6 lg:px-10",
            sticky ? "w-max" : "snap-x snap-mandatory overflow-x-auto scrollbar-none",
          )}
          onPointerMove={(e) => {
            cx.set(e.clientX);
            cy.set(e.clientY);
          }}
          onPointerLeave={() => setHovered(null)}
        >
          {areas.map((a, i) => (
            <li key={a.id} className="shrink-0 snap-start">
              <Link
                href={`/areas/${a.slug}`}
                onPointerEnter={() => setHovered(a)}
                onFocus={() => setHovered(null)}
                className={cn(
                  "group relative flex h-[26rem] w-[78vw] max-w-[22rem] flex-col justify-end overflow-hidden rounded-(--radius-card-lg) border border-hairline bg-ink-3 sm:w-[22rem] lg:h-[30rem]",
                  desktop && !reduce && "cursor-none",
                )}
              >
                {a.heroImage ? (
                  <Image
                    src={a.heroImage}
                    alt=""
                    fill
                    sizes="352px"
                    className="object-cover opacity-85 transition-[transform,opacity] duration-[1.2s] ease-(--ease-out-brand) group-hover:scale-[1.06] group-hover:opacity-100"
                  />
                ) : (
                  <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-ink-3),var(--color-ink))]" />
                )}
                <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-ink via-ink/35 to-transparent" />
                <span aria-hidden="true" className="absolute top-5 left-6 font-mono text-ivory/60 text-xs">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="relative z-10 flex flex-col gap-2 p-6">
                  <h3 className="font-display text-3xl">{a.name}</h3>
                  <p className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-ivory/70 text-xs">
                    <span>
                      {a.listingCount} {a.listingCount === 1 ? "listing" : "listings"}
                    </span>
                    {a.avgRentKes ? <span>· Avg rent {formatCompact(a.avgRentKes)}/mo</span> : null}
                    {!a.avgRentKes && a.avgSaleKes ? <span>· Avg price {formatCompact(a.avgSaleKes)}</span> : null}
                  </p>
                  {a.summary ? (
                    <p className="line-clamp-2 max-w-xs text-ivory/70 text-sm leading-relaxed">{a.summary}</p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </motion.ul>
      </div>

      {/* Cursor-follow preview (desktop, fine pointer, motion allowed) */}
      {desktop && !reduce ? (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 z-30"
          style={{ x: sx, y: sy }}
        >
          <AnimatePresence>
            {hovered ? (
              <motion.div
                key="cursor"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.2 }}
                className="-translate-x-1/2 -translate-y-1/2 flex size-28 flex-col items-center justify-center gap-0.5 rounded-full bg-gold text-center text-ink shadow-glow-gold"
              >
                <span className="text-[0.6rem] uppercase tracking-[0.2em]">Explore</span>
                <span className="px-2 font-display text-sm leading-tight">{hovered.name}</span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </section>
  );
}
