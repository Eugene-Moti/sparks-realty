"use client";

import { useSyncExternalStore } from "react";
import { createLocalStore } from "@/lib/local-store";

/**
 * Cookie / tracking consent (Kenya Data Protection Act 2019).
 * "essential" is always on (theme, currency, favourites, this choice itself).
 * Everything else is OFF until the visitor accepts it.
 *
 * Bump CONSENT_VERSION when categories or vendors change to ask again.
 */
export const CONSENT_VERSION = 1;

export type ConsentCategory = "analytics";

export type CookieConsent = {
  version: number;
  analytics: boolean;
  /** ISO timestamp of the decision. */
  decidedAt: string;
};

const consentStore = createLocalStore<CookieConsent | null>(
  "sp-cookie-consent",
  null,
  (v): v is CookieConsent | null =>
    v === null ||
    (typeof v === "object" &&
      typeof (v as CookieConsent).analytics === "boolean" &&
      typeof (v as CookieConsent).version === "number"),
);

// Whether the settings dialog is open (shared by the banner and footer link).
const dialogListeners = new Set<() => void>();
let dialogOpen = false;

function setDialogOpen(open: boolean) {
  dialogOpen = open;
  for (const l of dialogListeners) l();
}

function subscribeDialog(cb: () => void) {
  dialogListeners.add(cb);
  return () => {
    dialogListeners.delete(cb);
  };
}

function decide(analytics: boolean) {
  consentStore.write({ version: CONSENT_VERSION, analytics, decidedAt: new Date().toISOString() });
}

export const cookieConsent = {
  acceptAll: () => decide(true),
  rejectAll: () => decide(false),
  save: (choice: { analytics: boolean }) => decide(choice.analytics),
  openSettings: () => setDialogOpen(true),
  closeSettings: () => setDialogOpen(false),
};

const subscribeMounted = () => () => {};

export function useCookieConsent() {
  const stored = consentStore.useValue();
  const settingsOpen = useSyncExternalStore(subscribeDialog, () => dialogOpen, () => false);
  // false on the server and during hydration, true after: avoids flashing the banner.
  const mounted = useSyncExternalStore(subscribeMounted, () => true, () => false);

  const current = stored && stored.version === CONSENT_VERSION ? stored : null;

  return {
    mounted,
    /** Visitor has made a choice for the current consent version. */
    decided: current !== null,
    consent: current,
    allows: (category: ConsentCategory) => Boolean(current?.[category]),
    settingsOpen,
    ...cookieConsent,
  };
}
