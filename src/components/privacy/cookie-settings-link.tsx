"use client";

import { cookieConsent } from "@/lib/consent/cookie-consent";
import { cn } from "@/helpers/classname-helper";

/** Footer link that reopens the cookie preferences dialog. */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" onClick={cookieConsent.openSettings} className={cn("cursor-pointer", className)}>
      Cookie settings
    </button>
  );
}
