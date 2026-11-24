"use client";

import { type CSSProperties, createContext, type ElementType, type ReactNode, useContext, useEffect, useRef } from "react";

/**
 * Scroll reveals (fade + 16px rise, staggered in groups) with plain CSS
 * transitions. One shared IntersectionObserver per threshold flips
 * `data-revealed`; the styles live in globals.css ("Scroll reveals"). This keeps
 * hydration cheap — no animation-library instance per element — which matters
 * for Total Blocking Time on phones. Static under reduced motion, and visible
 * without JavaScript (<noscript> rule in the root layout).
 * Don't wrap LCP content (hero headline/image) — it starts hidden until revealed.
 */

const InGroup = createContext(false);
const observers = new Map<number, IntersectionObserver>();

function observe(el: Element, amount: number): () => void {
  let io = observers.get(amount);
  if (!io) {
    io = new IntersectionObserver(
      (entries, obs) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.revealed = "";
          obs.unobserve(e.target);
        }
      },
      { threshold: amount },
    );
    observers.set(amount, io);
  }
  const current = io;
  current.observe(el);
  return () => current.unobserve(el);
}

/** Marks the element `data-revealed` once `amount` of it has been on screen. */
export function useReveal<T extends HTMLElement>(amount: number, enabled = true) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    return observe(el, amount);
  }, [amount, enabled]);
  return ref;
}

type Tag = "div" | "section" | "li" | "ul" | "ol" | "article" | "header" | "p" | "span";

type RevealProps = {
  children: ReactNode;
  className?: string;
  as?: Tag;
  /** Extra delay in seconds (standalone use). */
  delay?: number;
  /** Fraction of the element that must be visible before it reveals. */
  amount?: number;
};

const ms = (s: number) => `${Math.round(s * 1000)}ms`;

/** Fade + 16px rise when scrolled into view. Inside <RevealGroup> it follows the group's trigger and stagger. */
export function Reveal({ children, className, as = "div", delay = 0, amount = 0.2 }: RevealProps) {
  const inGroup = useContext(InGroup);
  const ref = useReveal<HTMLElement>(amount, !inGroup);
  const Comp = as as ElementType;
  return (
    <Comp ref={ref} data-reveal="" className={className} style={delay ? ({ "--reveal-delay": ms(delay) } as CSSProperties) : undefined}>
      {children}
    </Comp>
  );
}

type RevealGroupProps = {
  children: ReactNode;
  className?: string;
  as?: Tag;
  /** Seconds between children. */
  stagger?: number;
  delay?: number;
  amount?: number;
};

/** Reveals its direct <Reveal> children one after another when the group enters view. */
export function RevealGroup({ children, className, as = "div", stagger = 0.08, delay = 0, amount = 0.15 }: RevealGroupProps) {
  const ref = useReveal<HTMLElement>(amount);
  const Comp = as as ElementType;
  return (
    <InGroup value>
      <Comp
        ref={ref}
        data-reveal-group=""
        className={className}
        style={{ "--reveal-stagger": ms(stagger), "--reveal-delay": ms(delay) } as CSSProperties}
      >
        {children}
      </Comp>
    </InGroup>
  );
}
