"use client";

import { createLocalStore } from "@/lib/local-store";

export const COMPARE_MAX = 3;

/** Property IDs selected for /compare (max 3), kept on the visitor's device. */
const store = createLocalStore<string[]>(
  "sp-compare",
  [],
  (v): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string"),
);

export function useCompare() {
  const ids = store.useValue();
  return {
    ids,
    count: ids.length,
    full: ids.length >= COMPARE_MAX,
    has: (id: string) => ids.includes(id),
    toggle: (id: string) =>
      store.write((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= COMPARE_MAX ? prev : [...prev, id],
      ),
    clear: () => store.write([]),
  };
}
