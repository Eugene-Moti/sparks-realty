"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo } from "react";
import { siteConfig } from "@/config/site";
import { type Currency, type FormattedPrice, formatPrice, type PriceInput } from "@/lib/format";
import { createLocalStore } from "@/lib/local-store";

const currencyStore = createLocalStore<Currency>(
  "sp-currency",
  "KES",
  (v): v is Currency => v === "KES" || v === "USD",
);

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** KES per 1 USD (site_settings.usd_rate). */
  usdRate: number;
  format: (price: PriceInput) => FormattedPrice;
};

/**
 * The context carries only the (server-provided, fixed) USD rate. The visitor's
 * chosen currency is read by each consumer from the local store, so restoring a
 * saved "USD" after hydration never changes a context value above the page —
 * which would force React to discard not-yet-hydrated sections
 * (see components/motion/hydrate-when-visible.tsx).
 */
const UsdRateContext = createContext<number | null>(null);

const setCurrency = (c: Currency) => currencyStore.write(c);

/**
 * Display currency for prices (KES primary, USD secondary), toggled in the
 * header and remembered on the visitor's device.
 */
export function CurrencyProvider({
  usdRate = siteConfig.defaultUsdRate,
  children,
}: {
  usdRate?: number;
  children: ReactNode;
}) {
  return <UsdRateContext value={usdRate}>{children}</UsdRateContext>;
}

export function useCurrency(): CurrencyContextValue {
  const usdRate = useContext(UsdRateContext);
  if (usdRate === null) throw new Error("useCurrency must be used inside <CurrencyProvider>.");
  const currency = currencyStore.useValue();
  const format = useCallback((price: PriceInput) => formatPrice(price, { currency, usdRate }), [currency, usdRate]);
  return useMemo(() => ({ currency, setCurrency, usdRate, format }), [currency, usdRate, format]);
}
