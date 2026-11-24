"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { useId } from "react";
import { easeOut } from "./easing";

/** Bars from public/brand/mark.svg (the compact icon), shortest first. */
const BARS = [
  { x: 172, y: 330, h: 68 },
  { x: 235, y: 292, h: 106 },
  { x: 298, y: 262, h: 136 },
] as const;

/**
 * The Sparks mark, animated: the gold roof draws in, the green bars rise one
 * after another, the underline draws, then the bars "breathe" gently.
 * Static under reduced motion.
 */
export function AnimatedMark({ className, title = "Sparks Properties" }: { className?: string; title?: string }) {
  const reduce = useReducedMotion();
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const gold = `${id}-gold`;
  const green = `${id}-green`;

  return (
    <svg viewBox="0 0 512 512" role="img" aria-label={title} className={className}>
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7D27A" />
          <stop offset=".55" stopColor="#E0B458" />
          <stop offset="1" stopColor="#B0862F" />
        </linearGradient>
        <linearGradient id={green} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#86C858" />
          <stop offset="1" stopColor="#3E7A28" />
        </linearGradient>
      </defs>

      <motion.path
        d="M78 300 L256 124 L434 300"
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth={50}
        strokeLinejoin="miter"
        strokeMiterlimit={10}
        initial={reduce ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.1, ease: easeOut }}
      />

      {BARS.map((b, i) => (
        // Outer group: one-time rise from the baseline. Inner rect: endless gentle "breathing".
        <motion.g
          key={b.x}
          style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
          initial={reduce ? false : { scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.6 + i * 0.16, ease: easeOut }}
        >
          <motion.rect
            x={b.x}
            y={b.y}
            width={42}
            height={b.h}
            rx={4}
            fill={`url(#${green})`}
            style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
            animate={reduce ? undefined : { scaleY: [1, 0.9, 1] }}
            transition={reduce ? undefined : { duration: 3.2, delay: 1.8 + i * 0.35, ease: "easeInOut", repeat: Infinity }}
          />
        </motion.g>
      ))}

      <motion.rect
        x="150"
        y="412"
        width="212"
        height="10"
        rx="5"
        fill={`url(#${gold})`}
        style={{ transformBox: "fill-box", transformOrigin: "left center" }}
        initial={reduce ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.9, delay: 0.5, ease: easeOut }}
      />
    </svg>
  );
}
