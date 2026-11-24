"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/**
 * Hydration-safe "prefers reduced motion". The server can't know the setting, so
 * during hydration this returns false (matching the server HTML) and switches to
 * the real value right after — unlike motion's useReducedMotion, which reads it on
 * the first client render and causes a hydration mismatch (React error #418).
 * Use this instead of importing useReducedMotion from "motion/react".
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
