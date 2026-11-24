import {
  ArrowRightIcon,
  CalendarCheckIcon,
  ClockIcon,
  EnvelopeSimpleIcon,
  HandshakeIcon,
  MapPinIcon,
  PhoneIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Magnetic } from "@/components/motion/magnetic";
import { Reveal, RevealGroup } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { formatPhoneDisplay, telLink, whatsappLink } from "@/lib/format";
import type { SiteSettings } from "@/lib/queries/site-settings";

const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Sparks Properties+Realty+Kileleshwa+Nairobi";

/** Closing section: list with us / book a viewing, contacts and the office "map". */
export function FinalCta({ settings }: { settings: SiteSettings }) {
  return (
    <section aria-labelledby="cta-title" className="mx-auto w-full max-w-[90rem] px-4 pt-8 pb-24 sm:px-6 lg:px-10 lg:pb-32">
      <h2 id="cta-title" className="sr-only">
        Work with Sparks Properties
      </h2>
      <RevealGroup className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Reveal className="flex flex-col justify-between gap-10 rounded-(--radius-card-lg) border border-hairline bg-surface p-8 shadow-soft sm:p-10">
          <div className="flex flex-col gap-4">
            <HandshakeIcon aria-hidden="true" className="size-9 text-accent" weight="light" />
            <p className="font-display text-[clamp(1.9rem,3.5vw,2.75rem)] leading-tight">List your property with us</p>
            <p className="max-w-md text-muted leading-relaxed">
              Professional photos and video, listings on our site and socials, vetted tenants and
              buyers, and clear monthly reporting.
            </p>
          </div>
          <div>
            <Magnetic>
              <Button asChild variant="gold-outline" size="lg">
                <Link href="/list-with-us">
                  Get a free valuation <ArrowRightIcon />
                </Link>
              </Button>
            </Magnetic>
          </div>
        </Reveal>

        <Reveal className="dark grain relative flex flex-col justify-between gap-10 overflow-hidden rounded-(--radius-card-lg) border border-hairline bg-ink p-8 text-ivory shadow-lift sm:p-10">
          <div className="relative z-10 flex flex-col gap-4">
            <CalendarCheckIcon aria-hidden="true" className="size-9 text-gold" weight="light" />
            <p className="font-display text-[clamp(1.9rem,3.5vw,2.75rem)] leading-tight">Book a viewing</p>
            <p className="max-w-md text-ivory/70 leading-relaxed">
              In person or by video call — tell us when suits you and we&apos;ll confirm within the hour
              during office hours.
            </p>
          </div>
          <div className="relative z-10 flex flex-wrap gap-3">
            <Magnetic>
              <Button asChild size="lg">
                <Link href="/contact?intent=viewing">Book a viewing</Link>
              </Button>
            </Magnetic>
            <Button asChild variant="gold-outline" size="lg">
              <a href={whatsappLink("Hi Sparks Properties, I'd like to book a viewing.", settings.whatsapp)} target="_blank" rel="noopener noreferrer">
                <WhatsappLogoIcon weight="fill" /> WhatsApp
              </a>
            </Button>
          </div>
        </Reveal>

        <Reveal className="grid gap-6 rounded-(--radius-card-lg) border border-hairline bg-surface p-8 sm:p-10 lg:col-span-2 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <div className="flex flex-col gap-5">
            <p className="eyebrow">Visit the office</p>
            <p className="font-display text-3xl">Kileleshwa, Nairobi</p>
            <ul className="flex flex-col gap-3 text-sm">
              <li>
                <a href={telLink(settings.phone)} className="flex items-center gap-3 hover:text-accent">
                  <PhoneIcon aria-hidden="true" className="size-4.5 text-accent" /> {formatPhoneDisplay(settings.phone)}
                </a>
              </li>
              <li>
                <a href={`mailto:${settings.email}`} className="flex items-center gap-3 break-all hover:text-accent">
                  <EnvelopeSimpleIcon aria-hidden="true" className="size-4.5 shrink-0 text-accent" /> {settings.email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <ClockIcon aria-hidden="true" className="size-4.5 text-accent" /> {settings.officeHours}
              </li>
            </ul>
          </div>
          <OfficeMap address={settings.address} />
        </Reveal>
      </RevealGroup>
    </section>
  );
}

/**
 * Privacy-friendly map snippet: a drawn, on-brand map (no third-party tiles or
 * cookies) that opens Google Maps in a new tab for directions.
 */
function OfficeMap({ address }: { address: string }) {
  return (
    <a
      href={MAPS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block aspect-16/9 overflow-hidden rounded-(--radius-card) border border-hairline bg-ink"
    >
      <svg viewBox="0 0 640 360" className="absolute inset-0 size-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="map-glow" cx="52%" cy="48%" r="45%">
            <stop offset="0" stopColor="#E0B458" stopOpacity="0.22" />
            <stop offset="1" stopColor="#E0B458" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="640" height="360" fill="#141416" />
        <g stroke="#2a2a2e" strokeWidth="14" fill="none" strokeLinecap="round">
          <path d="M-20 250 C 120 230, 220 200, 330 175 S 560 120, 680 90" />
          <path d="M120 -20 C 150 90, 210 170, 240 380" />
          <path d="M420 -20 C 400 80, 380 160, 410 380" />
        </g>
        <g stroke="#232326" strokeWidth="6" fill="none" strokeLinecap="round">
          <path d="M-20 120 C 100 130, 200 110, 320 95 S 520 70, 680 60" />
          <path d="M-20 320 C 140 300, 300 300, 680 260" />
          <path d="M520 -20 C 540 120, 560 220, 600 380" />
          <path d="M300 -20 C 310 60, 330 120, 330 175" />
          <path d="M60 380 C 80 300, 90 220, 40 -20" />
        </g>
        <path d="M-20 200 C 90 205, 160 230, 250 225 S 420 250, 680 230" stroke="#1f3b2a" strokeWidth="10" fill="none" opacity="0.7" />
        <rect width="640" height="360" fill="url(#map-glow)" />
        <g fill="#6f6a62" fontFamily="var(--font-geist-mono), monospace" fontSize="11" letterSpacing="2">
          <text x="40" y="112">WESTLANDS</text>
          <text x="455" y="300">KILIMANI</text>
          <text x="445" y="48">LAVINGTON</text>
        </g>
      </svg>
      <span className="absolute top-[46%] left-[52%] flex -translate-x-1/2 -translate-y-full flex-col items-center">
        <span className="rounded-full bg-gold px-3 py-1 font-medium text-ink text-xs shadow-glow-gold">Sparks Properties</span>
        <span className="mt-1 size-3 rounded-full border-2 border-ink bg-green-500 ring-4 ring-green-500/30" />
      </span>
      <span className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-full bg-ivory/90 px-3 py-1.5 font-medium text-ink text-xs transition-colors group-hover:bg-ivory">
        <MapPinIcon className="size-4" /> Get directions
        <span className="sr-only"> to {address} in Google Maps (opens in a new tab)</span>
      </span>
    </a>
  );
}
