/**
 * Calendar-date helpers on ISO "YYYY-MM-DD" strings. Dates are calendar days
 * (no time zone); "today" is the office's day in Nairobi, wherever the visitor is.
 */

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date in Nairobi as YYYY-MM-DD. */
export function nairobiToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(now);
}

/** Noon UTC keeps day arithmetic clear of DST and offset edge cases. */
const atNoon = (iso: string) => new Date(`${iso}T12:00:00Z`);

export function addDays(isoDate: string, days: number): string {
  const d = atNoon(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `a` to `b` (positive when b is later). */
export function daysBetween(a: string, b: string): number {
  return Math.round((atNoon(b).getTime() - atNoon(a).getTime()) / 86_400_000);
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && ISO_DATE.test(value) && !Number.isNaN(atNoon(value).getTime()) && atNoon(value).toISOString().startsWith(value);
}

/** A local Date (as used by date pickers) → YYYY-MM-DD, using its local calendar day. */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** YYYY-MM-DD → a local Date at midnight (for date pickers). */
export function fromIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const longFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const shortFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const shortWeekdayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/** "Fri, 12 Dec 2026" */
export const formatLongDate = (iso: string) => longFmt.format(atNoon(iso));
/** "12 Dec" */
export const formatShortDate = (iso: string) => shortFmt.format(atNoon(iso));
/** "Fri, 12 Dec" */
export const formatShortWeekdayDate = (iso: string) => shortWeekdayFmt.format(atNoon(iso));

/** "14:00:00" / "14:00" → "2pm"; "10:30" → "10:30am". */
export function formatClockTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return m ? `${hour}:${String(m).padStart(2, "0")}${suffix}` : `${hour}${suffix}`;
}

/** ISO timestamp `days` ago (for "this week" style queries). */
export function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}
