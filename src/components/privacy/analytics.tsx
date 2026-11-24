"use client";

import Script from "next/script";
import { useEffect } from "react";
import { GA_MEASUREMENT_ID, track } from "@/lib/analytics";
import { useCookieConsent } from "@/lib/consent/cookie-consent";

/**
 * Google Analytics 4, only after the visitor accepts analytics cookies
 * (Kenya DPA 2019). Nothing is requested from Google before that. If consent is
 * withdrawn later, GA is disabled and its cookies are removed.
 */
export function Analytics() {
  const { mounted, allows } = useCookieConsent();
  const allowed = mounted && allows("analytics") && !!GA_MEASUREMENT_ID;

  // Withdrawal: stop GA immediately and clear its cookies.
  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !mounted) return;
    const flag = `ga-disable-${GA_MEASUREMENT_ID}` as const;
    (window as unknown as Record<string, boolean>)[flag] = !allowed;
    if (!allowed) {
      window.gtag?.("consent", "update", { analytics_storage: "denied" });
      clearGaCookies();
    }
  }, [allowed, mounted]);

  // WhatsApp and call clicks anywhere on the site (one delegated listener).
  useEffect(() => {
    if (!allowed) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement)) return;
      const href = a.getAttribute("href") ?? "";
      const where = { page_path: window.location.pathname, link_location: a.dataset.track ?? sectionOf(a) };
      if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) track("whatsapp_click", where);
      else if (href.startsWith("tel:")) track("call_click", where);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [allowed]);

  if (!allowed) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
gtag('js',new Date());
gtag('config','${GA_MEASUREMENT_ID}',{allow_google_signals:false,allow_ad_personalization_signals:false});`}
      </Script>
    </>
  );
}

/** Rough location of a link for reports: header, footer, floating button, listing… */
function sectionOf(el: Element): string {
  if (el.closest("header")) return "header";
  if (el.closest("footer")) return "footer";
  if (el.closest("[data-floating-contact]")) return "floating";
  if (el.closest("[role=dialog]")) return "dialog";
  return "page";
}

function clearGaCookies() {
  const host = window.location.hostname;
  const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0]?.trim();
    if (!name || !/^(_ga|_gid|_gat)/.test(name)) continue;
    for (const d of domains) document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ""}`;
  }
}
