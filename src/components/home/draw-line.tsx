"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { easeOut } from "@/components/motion/easing";
import { cn } from "@/helpers/classname-helper";

/** Gold hairline that draws in from the left on load (the logo's underline). */
export function DrawLine({ className, delay = 0.6 }: { className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden="true"
      className={cn("block h-px origin-left bg-linear-to-r from-gold-200 via-gold to-transparent", className)}
      initial={reduce ? false : { scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 1.1, ease: easeOut, delay }}
    />
  );
}
