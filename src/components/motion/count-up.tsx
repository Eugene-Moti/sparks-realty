"use client";

import { animate, useInView } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { useEffect, useRef } from "react";
import { cn } from "@/helpers/classname-helper";
import { easeOut } from "./easing";

type CountUpProps = {
  value: number;
  /** Text after the number, e.g. "+" or "%". */
  suffix?: string;
  prefix?: string;
  /** Seconds. */
  duration?: number;
  className?: string;
};

const formatter = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 });

/**
 * Counts from 0 to `value` when scrolled into view. The final number is in the
 * server HTML (SEO, no-JS, reduced motion); the count only plays on the client.
 */
export function CountUp({ value, suffix = "", prefix = "", duration = 1.6, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const final = `${prefix}${formatter.format(value)}${suffix}`;

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView || reduce) return;
    const controls = animate(0, value, {
      duration,
      ease: easeOut,
      onUpdate: (v) => {
        node.textContent = `${prefix}${formatter.format(Math.round(v))}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, reduce, value, duration, prefix, suffix]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)} aria-label={final}>
      {final}
    </span>
  );
}
