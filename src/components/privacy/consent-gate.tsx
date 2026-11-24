"use client";

import type { ReactNode } from "react";
import { type ConsentCategory, useCookieConsent } from "@/lib/consent/cookie-consent";

/**
 * Renders children only after the visitor has accepted `category`.
 * Wrap every analytics script/component in this — e.g.
 * <ConsentGate category="analytics"><Analytics /></ConsentGate>
 */
export function ConsentGate({
  category,
  children,
  fallback = null,
}: {
  category: ConsentCategory;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { mounted, allows } = useCookieConsent();
  if (!mounted || !allows(category)) return <>{fallback}</>;
  return <>{children}</>;
}
