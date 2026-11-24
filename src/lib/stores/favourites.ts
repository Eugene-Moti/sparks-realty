"use client";

import { useCallback } from "react";
import { createLocalStore } from "@/lib/local-store";

/** Favourite property IDs, kept only on the visitor's device (essential storage). */
const store = createLocalStore<string[]>(
  "sp-favourites",
  [],
  (v): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string"),
);

export function useFavourites() {
  const ids = store.useValue();

  const toggle = useCallback((id: string) => {
    store.write((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]));
  }, []);

  const remove = useCallback((id: string) => {
    store.write((prev) => prev.filter((x) => x !== id));
  }, []);

  return {
    ids,
    count: ids.length,
    has: (id: string) => ids.includes(id),
    toggle,
    remove,
    clear: () => store.write([]),
  };
}
