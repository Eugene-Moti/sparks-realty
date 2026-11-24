"use client";

import { CalendarBlankIcon, XIcon } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { Popover } from "radix-ui";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/helpers/classname-helper";
import { useMediaQuery } from "@/hooks/use-media-query";
import { addDays, formatShortDate, formatShortWeekdayDate, fromIsoDate, nairobiToday, toIsoDate } from "@/lib/dates";
import { BOOKING_HORIZON_DAYS, MAX_NIGHTS, nightsBetween } from "@/lib/short-stay/stay";

// The calendar (react-day-picker + date-fns) loads the first time the picker opens.
const Calendar = dynamic(() => import("@/components/ui/calendar"), {
  ssr: false,
  loading: () => <Skeleton className="h-[21rem] w-[19.5rem] rounded-2xl sm:w-[40rem]" />,
});

export type DateRangeValue = { checkIn: string | null; checkOut: string | null };

type DateRangePickerProps = {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  id?: string;
  /** "hero" sits on the dark search bar; "field" matches form inputs. */
  variant?: "hero" | "field";
  className?: string;
  "aria-describedby"?: string;
};

/** "Fri, 12 Dec → Mon, 15 Dec · 3 nights" (or "12 Dec → 15 Dec · 3 nights" when compact). */
export function formatStayRange(checkIn: string | null, checkOut: string | null, compact = false): string | null {
  if (!checkIn) return null;
  const f = compact ? formatShortDate : formatShortWeekdayDate;
  if (!checkOut) return `${f(checkIn)} → add check-out`;
  const n = nightsBetween(checkIn, checkOut);
  return `${f(checkIn)} → ${f(checkOut)} · ${n} night${n === 1 ? "" : "s"}`;
}

/**
 * Check-in / check-out picker for short-stay search (hero, filters). A button
 * that opens a two-month range calendar (one month on phones). Availability
 * isn't known here — the results are filtered by the server.
 */
export function DateRangePicker({ value, onChange, id, variant = "field", className, ...rest }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const label = formatStayRange(value.checkIn, value.checkOut, variant === "field");

  function onSelect(_: DateRange | undefined, day: Date) {
    const iso = toIsoDate(day);
    const { checkIn, checkOut } = value;
    // Start a new stay unless we're choosing a check-out after the current check-in.
    if (!checkIn || checkOut || iso <= checkIn) {
      onChange({ checkIn: iso, checkOut: null });
      return;
    }
    onChange({ checkIn, checkOut: iso });
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className={cn("relative flex items-center", className)}>
        <Popover.Trigger asChild>
          <button
            id={id}
            type="button"
            aria-describedby={rest["aria-describedby"]}
            aria-label={`Dates: ${label ?? "add dates"}`}
            className={cn(
              "flex w-full min-w-0 items-center gap-2 text-left outline-none",
              value.checkIn && "pr-10",
              variant === "hero"
                ? "h-10 text-[0.95rem] text-ivory"
                : "h-11 rounded-(--radius-control) border border-border bg-surface px-3.5 text-sm transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <CalendarBlankIcon aria-hidden="true" className={cn("size-4.5 shrink-0", variant === "hero" ? "text-gold-200/80" : "text-accent")} />
            <span className={cn("truncate", !label && (variant === "hero" ? "text-ivory/60" : "text-muted"))}>
              {label ?? "Add dates"}
            </span>
          </button>
        </Popover.Trigger>
        {value.checkIn ? (
          <button
            type="button"
            onClick={() => onChange({ checkIn: null, checkOut: null })}
            aria-label="Clear dates"
            className={cn(
              "absolute right-1.5 grid size-8 place-items-center rounded-full transition-colors",
              variant === "hero" ? "text-ivory/70 hover:bg-ivory/10" : "text-muted hover:bg-foreground/8",
            )}
          >
            <XIcon className="size-4" />
          </button>
        ) : null}
      </div>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={10}
          collisionPadding={16}
          className="z-50 rounded-3xl border border-hairline bg-surface p-4 text-foreground shadow-lift data-[state=open]:animate-fade-in sm:p-5"
          data-lenis-prevent
        >
          <PickerCalendar value={value} onSelect={onSelect} />
          <div className="mt-3 flex items-center justify-between gap-3 border-hairline border-t pt-3">
            <p className="text-muted text-xs" aria-live="polite">
              {value.checkIn && !value.checkOut ? "Now choose your check-out date" : label ?? "Choose your check-in date"}
            </p>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** Rendered only while the popover is open, so "today" is always the browser's today. */
function PickerCalendar({ value, onSelect }: { value: DateRangeValue; onSelect: (range: DateRange | undefined, day: Date) => void }) {
  const twoMonths = useMediaQuery("(min-width: 640px)");
  const today = nairobiToday();
  const horizon = addDays(today, BOOKING_HORIZON_DAYS);
  const maxCheckOut = value.checkIn && !value.checkOut ? addDays(value.checkIn, MAX_NIGHTS) : null;
  const selected: DateRange | undefined = value.checkIn
    ? { from: fromIsoDate(value.checkIn), to: value.checkOut ? fromIsoDate(value.checkOut) : undefined }
    : undefined;

  return (
    <Calendar
      mode="range"
      selected={selected}
      onSelect={onSelect}
      numberOfMonths={twoMonths ? 2 : 1}
      defaultMonth={value.checkIn ? fromIsoDate(value.checkIn) : fromIsoDate(today)}
      startMonth={fromIsoDate(today)}
      endMonth={fromIsoDate(horizon)}
      disabled={[
        { before: fromIsoDate(today) },
        { after: fromIsoDate(horizon) },
        ...(maxCheckOut ? [{ after: fromIsoDate(maxCheckOut) }] : []),
      ]}
    />
  );
}
