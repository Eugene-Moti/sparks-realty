"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { type PointerEvent, type ReactNode, useEffect, useState } from "react";
import { cn } from "@/helpers/classname-helper";

type MagneticProps = {
  children: ReactNode;
  /** 0–1: how far the element follows the pointer. */
  strength?: number;
  className?: string;
};

/**
 * Pulls its child gently toward the pointer. Desktop (fine pointer) only;
 * inert on touch devices and under reduced motion.
 */
export function Magnetic({ children, strength = 0.3, className }: MagneticProps) {
  const reduce = useReducedMotion();
  const [finePointer, setFinePointer] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  useEffect(() => {
    const mql = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFinePointer(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  const enabled = finePointer && !reduce;

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!enabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((e.clientY - (rect.top + rect.height / 2)) * strength);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      className={cn("inline-flex", className)}
      style={enabled ? { x: sx, y: sy } : undefined}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.div>
  );
}
