"use client";

import type { ReactNode } from "react";
import { useReveal } from "@/components/motion/reveal";
import { cn } from "@/helpers/classname-helper";

type SectionHeadingProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  /** Right-side slot (e.g. "View all" link) when left-aligned. */
  action?: ReactNode;
  className?: string;
  id?: string;
};

/**
 * Small tracked-caps eyebrow + Marcellus title + a gold hairline that draws in
 * when scrolled into view (CSS transition; static under reduced motion).
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as: Title = "h2",
  action,
  className,
  id,
}: SectionHeadingProps) {
  const lineRef = useReveal<HTMLSpanElement>(1);
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        !centered && action && "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("flex max-w-2xl flex-col gap-4", centered && "mx-auto items-center text-center")}>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <Title id={id} className="text-[clamp(2rem,4.2vw,3.25rem)] text-foreground leading-[1.05]">
          {title}
        </Title>
        <span
          ref={lineRef}
          data-reveal-line=""
          aria-hidden="true"
          className={cn(
            "block h-px w-24 bg-linear-to-r from-gold-600 via-gold-400 to-transparent dark:from-gold-200 dark:via-gold",
            centered ? "origin-center bg-linear-to-r from-transparent via-gold-500 to-transparent" : "origin-left",
          )}
        />
        {description ? (
          <p className="text-base text-muted leading-relaxed sm:text-lg">{description}</p>
        ) : null}
      </div>
      {action && !centered ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
