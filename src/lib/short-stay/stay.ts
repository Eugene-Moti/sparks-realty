/**
 * Short-stay availability and pricing, shared by the server (validation,
 * enquiry route) and the browser (calendar, live quote).
 *
 * `short_stay_blocks` rows cover nights [starts_on, ends_on): ends_on is the
 * check-out morning, so a new guest can check in on the day another leaves.
 * Rows with reason = 'pricing' are seasonal rates (nightly_override_kes),
 * not closures; every other reason ('booked', 'maintenance', 'owner') closes
 * those nights.
 */

import { addDays, daysBetween, formatLongDate } from "@/lib/dates";

/** Nights can be requested this far ahead. */
export const BOOKING_HORIZON_DAYS = 365;
/** Longer stays are better handled as a furnished rental. */
export const MAX_NIGHTS = 90;
export const MAX_GUESTS_FALLBACK = 16;

export type StayBlock = {
  /** First night (YYYY-MM-DD). */
  start: string;
  /** Check-out day, exclusive (YYYY-MM-DD). */
  end: string;
  kind: "closed" | "pricing";
  /** Seasonal nightly rate for pricing rows. */
  nightlyKes: number | null;
};

/** What the calendar and quote need about a short stay. Safe to send to the browser. */
export type StayInfo = {
  propertyId: string;
  nightlyKes: number | null;
  cleaningFeeKes: number | null;
  minNights: number;
  maxGuests: number | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  blocks: StayBlock[];
};

export function blockFromRow(row: {
  starts_on: string;
  ends_on: string;
  reason: string | null;
  nightly_override_kes: number | string | null;
}): StayBlock {
  const rate = row.nightly_override_kes === null ? null : Number(row.nightly_override_kes);
  const pricing = row.reason === "pricing";
  return {
    start: row.starts_on,
    end: row.ends_on,
    kind: pricing ? "pricing" : "closed",
    nightlyKes: pricing && rate && rate > 0 ? rate : null,
  };
}

export const nightsBetween = (checkIn: string, checkOut: string) => daysBetween(checkIn, checkOut);

const covers = (b: StayBlock, night: string) => b.start <= night && night < b.end;

/** Is this night (the date you sleep there) closed? */
export function isNightClosed(blocks: StayBlock[], night: string): boolean {
  return blocks.some((b) => b.kind === "closed" && covers(b, night));
}

/** Closed nights as a Set, for fast calendar rendering. */
export function closedNights(blocks: StayBlock[], from: string, to: string): Set<string> {
  const out = new Set<string>();
  for (const b of blocks) {
    if (b.kind !== "closed") continue;
    let d = b.start < from ? from : b.start;
    while (d < b.end && d <= to) {
      out.add(d);
      d = addDays(d, 1);
    }
  }
  return out;
}

/** Nights with a seasonal rate, as a Set. */
export function seasonalNights(blocks: StayBlock[], from: string, to: string): Set<string> {
  const out = new Set<string>();
  for (const b of blocks) {
    if (b.kind !== "pricing" || !b.nightlyKes) continue;
    let d = b.start < from ? from : b.start;
    while (d < b.end && d <= to) {
      out.add(d);
      d = addDays(d, 1);
    }
  }
  return out;
}

/** The first closed night on or after `from`, or null. */
export function nextClosedNight(blocks: StayBlock[], from: string): string | null {
  let best: string | null = null;
  for (const b of blocks) {
    if (b.kind !== "closed" || b.end <= from) continue;
    const start = b.start < from ? from : b.start;
    if (!best || start < best) best = start;
  }
  return best;
}

/** Every night in [checkIn, checkOut) is open. */
export function isRangeOpen(blocks: StayBlock[], checkIn: string, checkOut: string): boolean {
  return !blocks.some((b) => b.kind === "closed" && b.start < checkOut && b.end > checkIn);
}

/** Nightly rate for one night: the latest seasonal rate covering it, else the base rate. */
function rateFor(blocks: StayBlock[], night: string, base: number): number {
  let rate = base;
  for (const b of blocks) if (b.kind === "pricing" && b.nightlyKes && covers(b, night)) rate = b.nightlyKes;
  return rate;
}

export type QuoteLine = { nights: number; rateKes: number; amountKes: number };

export type StayQuote = {
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  /** Consecutive nights at the same rate, in order. */
  lines: QuoteLine[];
  subtotalKes: number;
  cleaningFeeKes: number;
  totalKes: number;
  /** Average nightly rate (handy for WhatsApp and the slip). */
  averageNightlyKes: number;
};

/** nights × nightly rate (with seasonal rates) + cleaning fee = total. */
export function quoteStay(stay: Pick<StayInfo, "nightlyKes" | "cleaningFeeKes" | "blocks">, checkIn: string, checkOut: string, guests: number): StayQuote | null {
  const nights = nightsBetween(checkIn, checkOut);
  if (!stay.nightlyKes || nights < 1) return null;

  const lines: QuoteLine[] = [];
  for (let i = 0; i < nights; i++) {
    const rate = rateFor(stay.blocks, addDays(checkIn, i), stay.nightlyKes);
    const last = lines.at(-1);
    if (last && last.rateKes === rate) {
      last.nights += 1;
      last.amountKes += rate;
    } else {
      lines.push({ nights: 1, rateKes: rate, amountKes: rate });
    }
  }
  const subtotalKes = lines.reduce((s, l) => s + l.amountKes, 0);
  const cleaningFeeKes = stay.cleaningFeeKes ?? 0;
  return {
    checkIn,
    checkOut,
    nights,
    guests,
    lines,
    subtotalKes,
    cleaningFeeKes,
    totalKes: subtotalKes + cleaningFeeKes,
    averageNightlyKes: Math.round(subtotalKes / nights),
  };
}

export type StayProblem = { field: "check_in" | "check_out" | "guests"; message: string };

/** Everything that makes a stay impossible, with visitor-facing messages. */
export function stayProblems(
  stay: Pick<StayInfo, "minNights" | "maxGuests" | "blocks">,
  checkIn: string,
  checkOut: string,
  guests: number,
  today: string,
): StayProblem[] {
  const problems: StayProblem[] = [];
  const nights = nightsBetween(checkIn, checkOut);
  if (checkIn < today) problems.push({ field: "check_in", message: "Check-in can't be in the past." });
  else if (checkIn > addDays(today, BOOKING_HORIZON_DAYS)) {
    problems.push({ field: "check_in", message: "We take requests up to a year ahead." });
  }
  if (nights < 1) problems.push({ field: "check_out", message: "Check-out must be after check-in." });
  else if (nights < stay.minNights) {
    problems.push({ field: "check_out", message: `The minimum stay is ${stay.minNights} nights.` });
  } else if (nights > MAX_NIGHTS) {
    problems.push({ field: "check_out", message: `For stays over ${MAX_NIGHTS} nights, ask us about a furnished rental.` });
  }
  if (nights >= 1 && !isRangeOpen(stay.blocks, checkIn, checkOut)) {
    problems.push({ field: "check_in", message: "Some of those nights are already booked." });
  }
  const maxGuests = stay.maxGuests ?? MAX_GUESTS_FALLBACK;
  if (guests < 1) problems.push({ field: "guests", message: "Add at least one guest." });
  else if (guests > maxGuests) problems.push({ field: "guests", message: `This home sleeps up to ${maxGuests} guests.` });
  return problems;
}

const kes = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 });

/** "3 nights × KES 9,500 + cleaning KES 2,500 = KES 31,000" (KES, for staff and WhatsApp). */
export function quoteSummary(q: StayQuote): string {
  const nights = q.lines.map((l) => `${l.nights} night${l.nights === 1 ? "" : "s"} × KES ${kes.format(l.rateKes)}`).join(" + ");
  const cleaning = q.cleaningFeeKes ? ` + cleaning KES ${kes.format(q.cleaningFeeKes)}` : "";
  return `${nights}${cleaning} = KES ${kes.format(q.totalKes)}`;
}

/** Prefilled "Book on WhatsApp" message, with the quote when dates are chosen. */
export function stayWhatsAppMessage({
  title,
  refCode,
  url,
  quote,
}: {
  title: string;
  refCode: string | null;
  url: string;
  quote: StayQuote | null;
}): string {
  const head = `Hi Sparks Properties, I'd like to book ${title}${refCode ? ` (${refCode})` : ""} — ${url}`;
  if (!quote) return `${head}\nWhich dates are available?`;
  return [
    head,
    `Check-in: ${formatLongDate(quote.checkIn)}`,
    `Check-out: ${formatLongDate(quote.checkOut)} (${quote.nights} night${quote.nights === 1 ? "" : "s"})`,
    `Guests: ${quote.guests}`,
    `Quote: ${quoteSummary(quote)}`,
  ].join("\n");
}
