"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny localStorage-backed store usable with useSyncExternalStore.
 * Syncs across tabs, survives blocked storage (falls back to memory), and
 * renders `fallback` on the server and during hydration.
 */
export function createLocalStore<T>(key: string, fallback: T, validate?: (v: unknown) => v is T) {
  const listeners = new Set<() => void>();
  let memory: T = fallback;
  let cachedRaw: string | null | undefined;
  let cachedValue: T = fallback;

  function read(): T {
    let raw: string | null;
    try {
      raw = localStorage.getItem(key);
    } catch {
      return memory;
    }
    if (raw === cachedRaw) return cachedValue;
    cachedRaw = raw;
    if (raw === null) {
      cachedValue = fallback;
    } else {
      try {
        const parsed: unknown = JSON.parse(raw);
        cachedValue = !validate || validate(parsed) ? (parsed as T) : fallback;
      } catch {
        cachedValue = fallback;
      }
    }
    return cachedValue;
  }

  function write(next: T | ((prev: T) => T)) {
    const value = typeof next === "function" ? (next as (prev: T) => T)(read()) : next;
    memory = value;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage blocked: keep in memory for this page view.
      cachedRaw = undefined;
      cachedValue = value;
    }
    for (const l of listeners) l();
  }

  function subscribe(callback: () => void) {
    listeners.add(callback);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) callback();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(callback);
      window.removeEventListener("storage", onStorage);
    };
  }

  function useValue(): T {
    return useSyncExternalStore(subscribe, read, () => fallback);
  }

  return { read, write, subscribe, useValue };
}
