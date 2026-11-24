"use client";

import { CalendarCheckIcon, ChatCircleTextIcon, PhoneIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import { MobileContactBar } from "@/components/layout/mobile-contact-bar";
import { FavouriteButton } from "@/components/property/favourite-button";
import { useContact } from "@/components/providers/contact-provider";
import { useCurrency } from "@/components/providers/currency-provider";
import { Button } from "@/components/ui/button";
import { absoluteUrl } from "@/config/site";
import { cn } from "@/helpers/classname-helper";
import { formatShortWeekdayDate } from "@/lib/dates";
import { formatMoney, telLink, whatsappLink } from "@/lib/format";
import type { PropertyAgent } from "@/lib/queries/property-detail";
import { stayWhatsAppMessage } from "@/lib/short-stay/stay";
import { AgentCard, type PriceInfo, PriceTag } from "../price-panel";
import { ShareButton } from "../share-button";
import { useViewing } from "../viewing-context";
import { useStay } from "./stay-context";

/** Sticky booking summary for short stays: price, dates, total and the booking CTAs. */
export function StayPanel({ price, agent, className }: { price: PriceInfo; agent: PropertyAgent | null; className?: string }) {
  const { listing, dates, guests, quote, ready, requestBooking, goToCalendar } = useStay();
  const { open: askQuestion } = useViewing();
  const contact = useContact();
  const { currency, usdRate } = useCurrency();
  const url = absoluteUrl(listing.href);
  const money = (v: number) => formatMoney(v, currency, usdRate);
  const wa = whatsappLink(
    stayWhatsAppMessage({ title: listing.title, refCode: listing.refCode, url, quote: ready ? quote : null }),
    listing.agentWhatsapp || contact.whatsapp,
  );

  return (
    <div className={cn("flex flex-col gap-5 rounded-(--radius-card) border border-hairline bg-surface p-6 shadow-soft", className)}>
      <div className="flex items-start justify-between gap-3">
        <PriceTag price={price} />
        <FavouriteButton id={listing.id} title={listing.title} className="shrink-0 border border-border" />
      </div>

      <button
        type="button"
        onClick={goToCalendar}
        className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border text-left transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Name = this prefix + the visible text (WCAG 2.5.3 label in name). */}
        <span className="sr-only">{dates.checkIn && dates.checkOut ? "Change dates: " : "Choose dates: "}</span>
        <DateCell label="Check-in" value={dates.checkIn ? formatShortWeekdayDate(dates.checkIn) : "Add date"} />
        <DateCell label="Check-out" value={dates.checkOut ? formatShortWeekdayDate(dates.checkOut) : "Add date"} className="border-border border-l" />
        <DateCell label="Guests" value={`${guests} guest${guests === 1 ? "" : "s"}`} className="col-span-2 border-border border-t" />
      </button>

      {ready && quote ? (
        <dl className="flex flex-col gap-1.5 text-sm" aria-live="polite">
          {quote.lines.map((l) => (
            <div key={`${l.rateKes}-${l.nights}`} className="flex justify-between gap-3">
              <dt className="text-muted">
                {l.nights} night{l.nights === 1 ? "" : "s"} × {money(l.rateKes)}
              </dt>
              <dd className="font-mono">{money(l.amountKes)}</dd>
            </div>
          ))}
          {quote.cleaningFeeKes ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Cleaning fee</dt>
              <dd className="font-mono">{money(quote.cleaningFeeKes)}</dd>
            </div>
          ) : null}
          <div className="mt-1 flex justify-between gap-3 border-hairline border-t pt-2.5 font-medium">
            <dt>Total</dt>
            <dd className="font-mono">{money(quote.totalKes)}</dd>
          </div>
        </dl>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button variant="green-solid" size="lg" onClick={requestBooking} className="w-full">
          <CalendarCheckIcon weight="bold" />
          {ready ? "Request to book" : "Check availability"}
        </Button>
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <Button asChild variant="gold-outline" size="icon" className="size-11">
            <a href={telLink(listing.agentPhone || contact.phone)} aria-label="Call Sparks Properties">
              <PhoneIcon />
            </a>
          </Button>
          <Button asChild variant="gold-outline" className="px-3">
            <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="Book on WhatsApp (opens in a new tab)">
              <WhatsappLogoIcon weight="fill" className="text-green-600 dark:text-green-400" /> Book on WhatsApp
            </a>
          </Button>
        </div>
        <p className="text-center text-muted text-xs">No payment now — we confirm first.</p>
      </div>

      <AgentCard agent={agent} />

      <div className="flex items-center justify-between gap-2 border-hairline border-t pt-4">
        <Button variant="ghost" size="sm" onClick={askQuestion} className="-ml-2">
          <ChatCircleTextIcon /> Ask a question
        </Button>
        <ShareButton url={url} title={listing.title} text={`Have a look at this stay: ${listing.title}`} />
      </div>
    </div>
  );
}

function DateCell({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <span className={cn("flex flex-col gap-0.5 px-4 py-2.5", className)}>
      <span className="font-medium text-[0.65rem] text-muted uppercase tracking-[0.18em]">{label}</span>
      <span className="truncate text-sm">{value}</span>
    </span>
  );
}

/** Phone-only sticky bar for short stays: Call · WhatsApp (with quote) · Book. */
export function StayMobileBar() {
  const { listing, quote, ready, requestBooking } = useStay();
  const contact = useContact();
  return (
    <MobileContactBar
      phone={listing.agentPhone || contact.phone}
      whatsappNumber={listing.agentWhatsapp || contact.whatsapp}
      whatsappMessage={stayWhatsAppMessage({
        title: listing.title,
        refCode: listing.refCode,
        url: absoluteUrl(listing.href),
        quote: ready ? quote : null,
      })}
      onBookViewing={requestBooking}
      bookLabel={ready ? "Book" : "Check dates"}
    />
  );
}
