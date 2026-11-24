"use client";

import dynamic from "next/dynamic";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { isIsoDate, nairobiToday } from "@/lib/dates";
import { quoteStay, type StayInfo, type StayProblem, type StayQuote, stayProblems } from "@/lib/short-stay/stay";

const StayRequestDialog = dynamic(() => import("./stay-request-dialog"), { ssr: false });

/** What the booking UI needs to know about the listing (besides StayInfo). */
export type StayListing = {
  id: string;
  title: string;
  refCode: string | null;
  href: string;
  areaName: string | null;
  agentName: string | null;
  /** Agent's numbers when assigned; otherwise the office's are used. */
  agentPhone: string | null;
  agentWhatsapp: string | null;
};

export type StayDates = { checkIn: string | null; checkOut: string | null };

type StayContextValue = {
  listing: StayListing;
  stay: StayInfo;
  /** Nairobi "today" — null during SSR/hydration (the page HTML is cached). */
  today: string | null;
  dates: StayDates;
  guests: number;
  setDates: (d: StayDates) => void;
  setGuests: (n: number) => void;
  /** Quote for the chosen dates (null until both are picked). */
  quote: StayQuote | null;
  /** Why the chosen stay can't be requested (empty when it can). */
  problems: StayProblem[];
  /** Dates chosen, all nights open, guests within limits. */
  ready: boolean;
  /** Open the request form when ready; otherwise take the visitor to the calendar. */
  requestBooking: () => void;
  goToCalendar: () => void;
};

const StayContext = createContext<StayContextValue | null>(null);
const noopSubscribe = () => () => {};

export const BOOKING_SECTION_ID = "book";

/**
 * Booking state for a short-stay page: dates, guests and the live quote,
 * shared by the calendar section, the sticky panel and the mobile bar.
 * Dates from the search (?checkIn=…&checkOut=…&guests=…) are picked up on load.
 */
export function StayProvider({ listing, stay, children }: { listing: StayListing; stay: StayInfo; children: ReactNode }) {
  const today = useSyncExternalStore(noopSubscribe, () => nairobiToday(), () => null);
  const [dates, setDates] = useState<StayDates>({ checkIn: null, checkOut: null });
  const [guests, setGuestsState] = useState(() => Math.min(2, stay.maxGuests ?? 2));
  const [dialogLoaded, setDialogLoaded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Carry the visitor's search into the widget.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkIn = params.get("checkIn");
    const checkOut = params.get("checkOut");
    const g = Number(params.get("guests"));
    const t = nairobiToday();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off read of the URL after hydration
    if (isIsoDate(checkIn) && isIsoDate(checkOut) && checkIn >= t && checkOut > checkIn) setDates({ checkIn, checkOut });
    if (Number.isInteger(g) && g > 0) setGuestsState(Math.min(g, stay.maxGuests ?? g));
  }, [stay.maxGuests]);

  const setGuests = useCallback(
    (n: number) => setGuestsState(Math.max(1, Math.min(n, stay.maxGuests ?? 16))),
    [stay.maxGuests],
  );

  const { checkIn, checkOut } = dates;
  const complete = !!(checkIn && checkOut && today);
  const problems = useMemo(
    () => (complete && checkIn && checkOut && today ? stayProblems(stay, checkIn, checkOut, guests, today) : []),
    [complete, checkIn, checkOut, guests, stay, today],
  );
  const quote = useMemo(
    () => (complete && checkIn && checkOut && !problems.some((p) => p.field !== "guests") ? quoteStay(stay, checkIn, checkOut, guests) : null),
    [complete, checkIn, checkOut, guests, problems, stay],
  );
  const ready = complete && problems.length === 0;

  const goToCalendar = useCallback(() => {
    const section = document.getElementById(BOOKING_SECTION_ID);
    if (!section) return;
    section.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    // Focus the calendar for keyboard and screen-reader users, without a second jump.
    const target = section.querySelector<HTMLElement>("[data-stay-calendar] button:not([disabled])");
    target?.focus({ preventScroll: true });
  }, []);

  const requestBooking = useCallback(() => {
    if (!ready) {
      goToCalendar();
      return;
    }
    setDialogLoaded(true);
    setDialogOpen(true);
  }, [ready, goToCalendar]);

  const value = useMemo<StayContextValue>(
    () => ({ listing, stay, today, dates, guests, setDates, setGuests, quote, problems, ready, requestBooking, goToCalendar }),
    [listing, stay, today, dates, guests, setGuests, quote, problems, ready, requestBooking, goToCalendar],
  );

  return (
    <StayContext value={value}>
      {children}
      {dialogLoaded ? <StayRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} /> : null}
    </StayContext>
  );
}

export function useStay(): StayContextValue {
  const ctx = useContext(StayContext);
  if (!ctx) throw new Error("useStay must be used inside <StayProvider>.");
  return ctx;
}
