"use client";

import { type ReactNode, useMemo, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "sp-theme";

/**
 * Runs in <head> before first paint so the right theme class is applied with
 * no flash. Rendered from the (server) root layout, not from this client file.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t==="dark"||((!t||t==="system")&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}

function readStoredTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

const darkQuery = "(prefers-color-scheme: dark)";

function resolveCurrent(): ResolvedTheme {
  const theme = readStoredTheme();
  if (theme !== "system") return theme;
  return window.matchMedia(darkQuery).matches ? "dark" : "light";
}

/** Apply the stored/system theme to <html>, then notify subscribers. */
function syncAndEmit() {
  applyTheme(resolveCurrent());
  emit();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const mql = window.matchMedia(darkQuery);
  mql.addEventListener("change", syncAndEmit);
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) syncAndEmit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    mql.removeEventListener("change", syncAndEmit);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): string {
  const theme = readStoredTheme();
  const systemDark = window.matchMedia(darkQuery).matches;
  return `${theme}:${systemDark ? "dark" : "light"}`;
}

function getServerSnapshot(): string {
  return "system:light";
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  // Suppress transitions while swapping so colours don't animate on toggle.
  const style = document.createElement("style");
  style.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(style);
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  window.getComputedStyle(document.body);
  requestAnimationFrame(() => style.remove());
}

/** Change the theme ("system" follows the device). Works anywhere on the client. */
function setTheme(next: Theme) {
  try {
    if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, next);
    syncAndEmit();
  } catch {
    // Storage blocked (private mode): apply for this page view only.
    const systemDark = window.matchMedia(darkQuery).matches;
    applyTheme(next === "system" ? (systemDark ? "dark" : "light") : next);
  }
}

/**
 * Kept for the component tree's structure; it no longer provides a changing
 * value. Consumers read the theme store directly in useTheme(), so the theme
 * resolving to "dark" after hydration never changes a context above the page
 * (that would force React to discard not-yet-hydrated sections — see
 * components/motion/hydrate-when-visible.tsx). The <html> class is set before paint
 * by themeInitScript and afterwards only by setTheme / system changes.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useTheme(): ThemeContextValue {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [theme, system] = snapshot.split(":") as [Theme, ResolvedTheme];
  const resolvedTheme: ResolvedTheme = theme === "system" ? system : theme;
  return useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme]);
}
