import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Suspense } from "react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { HydrateWhenVisible } from "@/components/motion/hydrate-when-visible";
import { Analytics } from "@/components/privacy/analytics";
import { CookieBanner } from "@/components/privacy/cookie-banner";
import { ContactProvider } from "@/components/providers/contact-provider";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { LenisProvider } from "@/components/providers/lenis-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSiteSettings } from "@/lib/queries/site-settings";

/** Public site chrome: header, footer, WhatsApp button, cookie banner. */
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  // Cached ("use cache" + tag), so this stays in the static shell.
  const settings = await getSiteSettings();

  return (
    <NuqsAdapter>
    <CurrencyProvider usdRate={settings.usdRate}>
      <ContactProvider value={{ phone: settings.phone, whatsapp: settings.whatsapp }}>
      <TooltipProvider delayDuration={250}>
        <LenisProvider>
          <Header whatsappNumber={settings.whatsapp} phone={settings.phone} socials={settings.social} />
          <main id="main" className="flex flex-1 flex-col">
            {children}
          </main>
          {/* The footer hydrates when it nears the viewport (see HydrateWhenVisible). */}
          <HydrateWhenVisible className="cv-auto [contain-intrinsic-size:auto_1100px]">
            <Footer settings={settings} />
          </HydrateWhenVisible>
          <Suspense fallback={null}>
            <WhatsAppFloat number={settings.whatsapp} />
            <CookieBanner />
            <Analytics />
          </Suspense>
        </LenisProvider>
      </TooltipProvider>
      </ContactProvider>
    </CurrencyProvider>
    </NuqsAdapter>
  );
}
