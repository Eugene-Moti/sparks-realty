"use client";

import { createLocalStore } from "@/lib/local-store";

/** Recently viewed listing IDs, newest first. Kept only on the visitor's device. */
export const RECENT_MAX = 12;

export const recentlyViewedStore = createLocalStore<string[]>(
  "sp-recent",
  [],
  (v): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string"),
);

export function recordRecentlyViewed(id: string) {
  recentlyViewedStore.write((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, RECENT_MAX));
}
