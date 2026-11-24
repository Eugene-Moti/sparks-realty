import { siteConfig } from "@/config/site";

export type Currency = "KES" | "USD";
/** Mirrors the `price_period` check constraint on `properties`. */
export type PricePeriod = "once" | "month" | "night";

const kesFormatter = new Intl.NumberFormat("en-KE", {
  maximumFractionDigits: 0,
});
const usdFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});
const compactFormatter = new Intl.NumberFormat("en-KE", {
  notation: "compact",
  maximumFractionDigits: 1,
});

type Numeric = number | string | null | undefined;

function toNumber(value: Numeric): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : null;
}

/** "KES 35,000,000" */
export function formatKES(amount: Numeric): string {
  const n = toNumber(amount);
  return n === null ? "" : `KES ${kesFormatter.format(Math.round(n))}`;
}

/** "USD 270,270" */
export function formatUSD(amount: Numeric): string {
  const n = toNumber(amount);
  return n === null ? "" : `USD ${usdFormatter.format(Math.round(n))}`;
}

/** "KES 35M", "KES 120K" — for map pins and tight UI. */
export function formatCompact(amount: Numeric, currency: Currency = "KES"): string {
  const n = toNumber(amount);
  return n === null ? "" : `${currency} ${compactFormatter.format(n)}`;
}

/** Convert KES to USD using `site_settings.usd_rate` (KES per 1 USD). */
export function kesToUsd(
  amountKes: Numeric,
  usdRate: Numeric = siteConfig.defaultUsdRate,
): number | null {
  const kes = toNumber(amountKes);
  const rate = toNumber(usdRate);
  if (kes === null || !rate || rate <= 0) return null;
  return kes / rate;
}

export function formatMoney(
  amountKes: Numeric,
  currency: Currency = "KES",
  usdRate: Numeric = siteConfig.defaultUsdRate,
): string {
  return currency === "KES"
    ? formatKES(amountKes)
    : formatUSD(kesToUsd(amountKes, usdRate));
}

const periodSuffix: Record<PricePeriod, string> = {
  once: "",
  month: "/month",
  night: "/night",
};

/** "/month", "/night" or "" for sale prices. */
export function pricePeriodSuffix(period: PricePeriod | null | undefined): string {
  return period ? periodSuffix[period] : "";
}

/** Human label for admin selects and filters. */
export const pricePeriodLabels: Record<PricePeriod, string> = {
  once: "One-off (sale)",
  month: "Per month",
  night: "Per night",
};

export type PriceInput = {
  priceKes: Numeric;
  period?: PricePeriod | null;
  priceOnRequest?: boolean | null;
};

export type FormattedPrice = {
  /** Primary line in the selected currency, e.g. "KES 180,000/month". */
  primary: string;
  /** The other currency, e.g. "≈ USD 1,390/month"; empty when not applicable. */
  secondary: string;
  onRequest: boolean;
};

/**
 * Format a listing price in the chosen display currency with the other
 * currency as a secondary line. KES is always the source of truth.
 */
export function formatPrice(
  { priceKes, period, priceOnRequest }: PriceInput,
  {
    currency = "KES",
    usdRate = siteConfig.defaultUsdRate,
  }: { currency?: Currency; usdRate?: Numeric } = {},
): FormattedPrice {
  if (priceOnRequest || toNumber(priceKes) === null) {
    return { primary: "Price on request", secondary: "", onRequest: true };
  }
  const suffix = pricePeriodSuffix(period);
  const kes = `${formatKES(priceKes)}${suffix}`;
  const usdAmount = kesToUsd(priceKes, usdRate);
  const usd = usdAmount === null ? "" : `${formatUSD(usdAmount)}${suffix}`;

  return currency === "KES"
    ? { primary: kes, secondary: usd ? `≈ ${usd}` : "", onRequest: false }
    : { primary: usd || kes, secondary: usd ? kes : "", onRequest: false };
}

// ---------- Phone / WhatsApp ----------

/** Strip everything but digits, e.g. "+254 792 573 443" → "254792573443". */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Normalise a Kenyan number to wa.me digits: "0712 345678" → "254712345678". */
export function toWhatsAppNumber(phone: string): string {
  const digits = digitsOnly(phone);
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
}

/** https://wa.me/254792573443?text=… — defaults to the company number. */
export function whatsappLink(
  message?: string,
  phone: string = siteConfig.contact.whatsapp.number,
): string {
  const base = `https://wa.me/${toWhatsAppNumber(phone)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Prefilled listing message per CLAUDE.md product rules. */
export function listingWhatsAppMessage({
  title,
  refCode,
  url,
}: {
  title: string;
  refCode?: string | null;
  url: string;
}): string {
  const ref = refCode ? ` (${refCode})` : "";
  return `Hi Sparks Properties, I'm interested in ${title}${ref} — ${url}`;
}

export function listingWhatsAppLink(
  listing: { title: string; refCode?: string | null; url: string },
  phone?: string,
): string {
  return whatsappLink(listingWhatsAppMessage(listing), phone);
}

/** "+254792573443" / "0792573443" / "254792573443" → "+254 792 573 443". */
export function formatPhoneDisplay(phone: string): string {
  const digits = toWhatsAppNumber(phone);
  if (digits.startsWith("254") && digits.length === 12) {
    const n = digits.slice(3);
    return `+254 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
  }
  return digits ? `+${digits}` : phone;
}

/** tel: link in E.164, e.g. "tel:+254792573443". */
export function telLink(phone: string = siteConfig.contact.phone.e164): string {
  const digits = toWhatsAppNumber(phone);
  return `tel:+${digits}`;
}
