/** Dialling codes offered on public forms. Kenya first, then the diaspora's most common. */
export const PHONE_COUNTRIES = [
  { code: "+254", iso: "KE", label: "Kenya" },
  { code: "+256", iso: "UG", label: "Uganda" },
  { code: "+255", iso: "TZ", label: "Tanzania" },
  { code: "+250", iso: "RW", label: "Rwanda" },
  { code: "+44", iso: "GB", label: "United Kingdom" },
  { code: "+1", iso: "US", label: "United States / Canada" },
  { code: "+971", iso: "AE", label: "United Arab Emirates" },
  { code: "+974", iso: "QA", label: "Qatar" },
  { code: "+966", iso: "SA", label: "Saudi Arabia" },
  { code: "+49", iso: "DE", label: "Germany" },
  { code: "+31", iso: "NL", label: "Netherlands" },
  { code: "+46", iso: "SE", label: "Sweden" },
  { code: "+61", iso: "AU", label: "Australia" },
  { code: "+27", iso: "ZA", label: "South Africa" },
  { code: "+91", iso: "IN", label: "India" },
  { code: "+86", iso: "CN", label: "China" },
] as const;

export type DialCode = (typeof PHONE_COUNTRIES)[number]["code"];
export const DIAL_CODES = PHONE_COUNTRIES.map((c) => c.code) as [DialCode, ...DialCode[]];

/**
 * "+254" + "0712 345 678" → "+254712345678". Drops the national trunk 0 and
 * any repeated country code. Returns null when the result isn't 7–15 digits.
 */
export function toE164(dialCode: string, national: string): string | null {
  const cc = dialCode.replace(/\D/g, "");
  let digits = national.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith(cc) && digits.length > cc.length + 6) digits = digits.slice(cc.length);
  digits = digits.replace(/^0+/, "");
  const full = cc + digits;
  return full.length >= 7 && full.length <= 15 && digits.length >= 6 ? `+${full}` : null;
}
