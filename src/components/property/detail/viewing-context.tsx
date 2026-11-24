"use client";

import dynamic from "next/dynamic";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

const ViewingDialog = dynamic(() => import("./viewing-dialog"), { ssr: false });

/** What the viewing form needs to know about the listing. */
export type ViewingListing = {
  id: string;
  title: string;
  refCode: string | null;
  href: string;
  areaName: string | null;
  agentName: string | null;
  /** "viewing" books a visit; "enquiry" asks a question (sold/let homes, short stays). */
  intent: "viewing" | "enquiry";
};

type ViewingContextValue = { open: () => void; intent: ViewingListing["intent"] };

const ViewingContext = createContext<ViewingContextValue | null>(null);

/**
 * Owns the "Book a viewing" dialog for a listing page, so the sticky price
 * panel, the mobile contact bar and in-page CTAs all open the same form.
 * The dialog (form, validation, receipt printer) loads on first open.
 */
export function ViewingProvider({ listing, children }: { listing: ViewingListing; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const open = useCallback(() => {
    setLoaded(true);
    setIsOpen(true);
  }, []);
  const value = useMemo(() => ({ open, intent: listing.intent }), [open, listing.intent]);

  return (
    <ViewingContext value={value}>
      {children}
      {loaded ? <ViewingDialog listing={listing} open={isOpen} onOpenChange={setIsOpen} /> : null}
    </ViewingContext>
  );
}

export function useViewing(): ViewingContextValue {
  const ctx = useContext(ViewingContext);
  if (!ctx) throw new Error("useViewing must be used inside <ViewingProvider>.");
  return ctx;
}
