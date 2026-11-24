"use client";

import "lenis/dist/lenis.css";

import Lenis from "lenis";
import { type ReactNode, useEffect } from "react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";

/**
 * Smooth scrolling for the public site, started in an effect with no React
 * context: nothing above the page changes after hydration (a context change would
 * force React to discard not-yet-hydrated sections — see
 * components/motion/hydrate-when-visible.tsx), and the tree is the same with or
 * without reduced motion. Off (native scrolling) when the visitor prefers reduced
 * motion, and reacts if that setting changes. Pauses while a Radix dialog/sheet
 * locks page scroll (body[data-scroll-locked]).
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      smoothWheel: true,
      // Keep native touch scrolling on phones/tablets: it already feels right
      // and avoids fighting carousels and the mobile card hand.
      syncTouch: false,
      // In-page links (#tour, #location…) glide, clearing the sticky header.
      anchors: { offset: -96 },
      // Let inner scroll areas (dialogs, sheets, maps) scroll natively.
      allowNestedScroll: true,
    });

    const body = document.body;
    const sync = () => {
      if (body.hasAttribute("data-scroll-locked")) lenis.stop();
      else lenis.start();
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(body, { attributes: true, attributeFilter: ["data-scroll-locked"] });

    return () => {
      observer.disconnect();
      lenis.destroy();
    };
  }, [reduce]);

  return <>{children}</>;
}
