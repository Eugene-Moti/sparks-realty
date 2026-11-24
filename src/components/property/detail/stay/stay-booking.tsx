"use client";

import { CalendarCheckIcon, MinusIcon, PlusIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { useContact } from "@/components/providers/contact-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { absoluteUrl } from "@/config/site";
import { cn } from "@/helpers/classname-helper";
import { formatClockTime } from "@/lib/dates";
import { whatsappLink } from "@/lib/format";
import { MAX_GUESTS_FALLBACK, stayWhatsAppMessage } from "@/lib/short-stay/stay";
import { formatStayRange } from "@/components/search/date-range-picker";
import { useStay } from "./stay-context";
import { StayQuoteReceipt } from "./stay-quote";

const CALENDAR_SKELETON = "h-[24.5rem] w-full rounded-(--radius-card)";
const StayCalendar = dynamic(() => import("./stay-calendar"), {
  ssr: false,
  loading: () => <Skeleton className={CALENDAR_SKELETON} />,
});

/** The #book section: availability calendar, guests, live quote and booking CTAs. */
export function StayBooking() {
  const { listing, stay, today, dates, setDates, guests, setGuests, quote, problems, ready, requestBooking } = useStay();
  const contact = useContact();
  const range = formatStayRange(dates.checkIn, dates.checkOut);
  const maxGuests = stay.maxGuests ?? MAX_GUESTS_FALLBACK;
  const wa = whatsappLink(
    stayWhatsAppMessage({ title: listing.title, refCode: listing.refCode, url: absoluteUrl(listing.href), quote: ready ? quote : null }),
    listing.agentWhatsapp || contact.whatsapp,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium" aria-live="polite">
          {range ?? "Select your check-in date"}
        </p>
        {dates.checkIn ? (
          <Button variant="ghost" size="sm" onClick={() => setDates({ checkIn: null, checkOut: null })}>
            Clear dates
          </Button>
        ) : null}
      </div>

      {today ? <StayCalendar today={today} /> : <Skeleton className={CALENDAR_SKELETON} />}

      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-muted text-xs" aria-label="Calendar key">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="font-mono text-foreground/60 line-through">14</span> Booked
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-gold-600 dark:bg-gold" /> Seasonal rate
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-6 rounded-full bg-gold/25" /> Your stay
        </li>
      </ul>

      <div className="grid items-start gap-8 sm:grid-cols-[minmax(0,1fr)_22rem] lg:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-hairline bg-surface p-4">
            <div>
              <p className="font-medium" id="stay-guests-label">
                Guests
              </p>
              <p className="text-muted text-xs">Sleeps up to {maxGuests}</p>
            </div>
            <div className="flex items-center gap-3" role="group" aria-labelledby="stay-guests-label">
              <Button
                variant="ghost"
                size="icon-sm"
                className="border border-border"
                onClick={() => setGuests(guests - 1)}
                disabled={guests <= 1}
                aria-label="Fewer guests"
              >
                <MinusIcon />
              </Button>
              <output aria-live="polite" className="w-6 text-center font-mono text-lg">
                {guests}
              </output>
              <Button
                variant="ghost"
                size="icon-sm"
                className="border border-border"
                onClick={() => setGuests(guests + 1)}
                disabled={guests >= maxGuests}
                aria-label="More guests"
              >
                <PlusIcon />
              </Button>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Fact label="Minimum stay" value={`${stay.minNights} night${stay.minNights === 1 ? "" : "s"}`} />
            {stay.cleaningFeeKes ? <Fact label="Cleaning" value="One fee per stay" /> : null}
            {stay.checkInTime ? <Fact label="Check-in" value={`From ${formatClockTime(stay.checkInTime)}`} /> : null}
            {stay.checkOutTime ? <Fact label="Check-out" value={`By ${formatClockTime(stay.checkOutTime)}`} /> : null}
          </dl>

          {problems.length ? (
            <ul role="alert" className="flex flex-col gap-1 font-medium text-danger text-sm">
              {problems.map((p) => (
                <li key={p.message}>{p.message}</li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <Button variant="green-solid" size="lg" onClick={requestBooking} className="flex-1">
              <CalendarCheckIcon weight="bold" />
              {ready ? "Request to book" : "Choose dates to book"}
            </Button>
            <Button asChild variant="gold-outline" size="lg" className="flex-1">
              <a href={wa} target="_blank" rel="noopener noreferrer">
                <WhatsappLogoIcon weight="fill" /> Book on WhatsApp
              </a>
            </Button>
          </div>
          <p className={cn("text-muted text-xs leading-relaxed")}>
            No payment now. We confirm availability with you first, then share how to pay.
          </p>
        </div>

        <StayQuoteReceipt
          quote={ready ? quote : null}
          title={listing.title}
          refCode={listing.refCode}
          checkInTime={stay.checkInTime}
          checkOutTime={stay.checkOutTime}
          idleLabel={dates.checkIn && !dates.checkOut ? "Now pick your check-out" : "Choose dates for a quote"}
        />
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
