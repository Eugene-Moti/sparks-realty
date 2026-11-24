"use client";

import { useMemo } from "react";
import type { DateRange, Matcher } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { useMediaQuery } from "@/hooks/use-media-query";
import { addDays, fromIsoDate, toIsoDate } from "@/lib/dates";
import { BOOKING_HORIZON_DAYS, closedNights, MAX_NIGHTS, nextClosedNight, seasonalNights } from "@/lib/short-stay/stay";
import { useStay } from "./stay-context";

/**
 * Availability calendar + range picker for one short stay. Nights are the
 * dates you sleep there: a closed night can't be a check-in, but the first
 * closed night after your check-in is still a valid check-out morning.
 * Loaded on the client only (it depends on today's date).
 */
export default function StayCalendar({ today }: { today: string }) {
  const { stay, dates, setDates } = useStay();
  // Two months where the main column is wide enough: tablets, and desktops from xl.
  const twoMonths = useMediaQuery("(min-width: 640px) and (max-width: 1023.98px), (min-width: 1280px)");
  const horizon = addDays(today, BOOKING_HORIZON_DAYS);

  const closed = useMemo(() => closedNights(stay.blocks, today, horizon), [stay.blocks, today, horizon]);
  const seasonal = useMemo(() => seasonalNights(stay.blocks, today, horizon), [stay.blocks, today, horizon]);

  const { checkIn, checkOut } = dates;
  const pickingCheckOut = !!checkIn && !checkOut;
  // While choosing a check-out: from the minimum stay up to the next closed night (inclusive).
  const lastCheckOut = useMemo(() => {
    if (!pickingCheckOut || !checkIn) return null;
    const nextClosed = nextClosedNight(stay.blocks, addDays(checkIn, 1));
    const cap = addDays(checkIn, MAX_NIGHTS);
    return nextClosed && nextClosed < cap ? nextClosed : cap;
  }, [pickingCheckOut, checkIn, stay.blocks]);
  const firstCheckOut = checkIn ? addDays(checkIn, stay.minNights) : null;

  const isValidCheckIn = (iso: string) => iso >= today && iso <= horizon && !closed.has(iso);
  const isValidCheckOut = (iso: string) =>
    !!(pickingCheckOut && firstCheckOut && lastCheckOut && iso >= firstCheckOut && iso <= lastCheckOut);

  const disabled: Matcher = (day: Date) => {
    const iso = toIsoDate(day);
    if (pickingCheckOut) {
      // Nights inside the minimum stay can't end it, and shouldn't restart it either.
      if (checkIn && iso > checkIn && firstCheckOut && iso < firstCheckOut) return true;
      return !(isValidCheckOut(iso) || isValidCheckIn(iso));
    }
    return !isValidCheckIn(iso);
  };

  const modifiers: Record<string, Matcher> = {
    // Struck through: closed, except the check-out morning we can still offer.
    booked: (day: Date) => {
      const iso = toIsoDate(day);
      return closed.has(iso) && !(pickingCheckOut && isValidCheckOut(iso));
    },
    seasonal: (day: Date) => seasonal.has(toIsoDate(day)),
  };

  function onSelect(_: DateRange | undefined, day: Date) {
    const iso = toIsoDate(day);
    if (pickingCheckOut && checkIn && iso > checkIn && isValidCheckOut(iso)) {
      setDates({ checkIn, checkOut: iso });
      return;
    }
    if (isValidCheckIn(iso)) setDates({ checkIn: iso, checkOut: null });
  }

  const selected: DateRange | undefined = checkIn
    ? { from: fromIsoDate(checkIn), to: checkOut ? fromIsoDate(checkOut) : undefined }
    : undefined;

  return (
    <div data-stay-calendar className="flex justify-center rounded-(--radius-card) border border-hairline bg-surface p-4 sm:p-6">
      <Calendar
        mode="range"
        selected={selected}
        onSelect={onSelect}
        numberOfMonths={twoMonths ? 2 : 1}
        defaultMonth={checkIn ? fromIsoDate(checkIn) : fromIsoDate(today)}
        startMonth={fromIsoDate(today)}
        endMonth={fromIsoDate(horizon)}
        disabled={disabled}
        modifiers={modifiers}
        modifiersClassNames={{
          booked: "[&>button]:text-foreground/30 [&>button]:line-through [&>button]:decoration-foreground/40",
          seasonal:
            "[&>button]:after:absolute [&>button]:after:bottom-1.5 [&>button]:after:left-1/2 [&>button]:after:size-1 [&>button]:after:-translate-x-1/2 [&>button]:after:rounded-full [&>button]:after:bg-gold-600 dark:[&>button]:after:bg-gold [&>button]:after:content-['']",
        }}
        labels={{
          labelDayButton: (day, mods) => {
            const iso = toIsoDate(day);
            const base = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(day);
            const notes = [
              mods.today ? "today" : null,
              closed.has(iso) ? (pickingCheckOut && isValidCheckOut(iso) ? "check-out only" : "booked") : null,
              seasonal.has(iso) ? "seasonal rate" : null,
              mods.range_start ? "check-in" : null,
              mods.range_end ? "check-out" : null,
            ].filter(Boolean);
            return notes.length ? `${base}, ${notes.join(", ")}` : base;
          },
        }}
      />
    </div>
  );
}
