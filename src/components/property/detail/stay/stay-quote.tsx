"use client";

import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { useEffect, useState } from "react";
import { ReceiptPrinter, type ReceiptPrinterStage } from "@/components/motion/receipt-printer";
import { useCurrency } from "@/components/providers/currency-provider";
import { formatClockTime, formatShortWeekdayDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import type { StayQuote } from "@/lib/short-stay/stay";

const PROCESSING_MS = 320;
const PRINTING_MS = 1800;

/** One receipt body for quotes and booking slips. */
export function StayReceiptLines({
  quote,
  checkInTime,
  checkOutTime,
}: {
  quote: StayQuote;
  checkInTime: string | null;
  checkOutTime: string | null;
}) {
  const { currency, usdRate } = useCurrency();
  const money = (v: number) => formatMoney(v, currency, usdRate);
  const other = (v: number) => formatMoney(v, currency === "KES" ? "USD" : "KES", usdRate);

  return (
    <>
      <ReceiptPrinter.Row
        label="Check-in"
        value={`${formatShortWeekdayDate(quote.checkIn)}${checkInTime ? ` · ${formatClockTime(checkInTime)}` : ""}`}
      />
      <ReceiptPrinter.Row
        label="Check-out"
        value={`${formatShortWeekdayDate(quote.checkOut)}${checkOutTime ? ` · ${formatClockTime(checkOutTime)}` : ""}`}
      />
      <ReceiptPrinter.Row label="Guests" value={quote.guests} />
      <ReceiptPrinter.Divider />
      {quote.lines.map((l) => (
        <ReceiptPrinter.Row
          key={`${l.rateKes}-${l.nights}`}
          label={`${l.nights} night${l.nights === 1 ? "" : "s"} × ${money(l.rateKes)}`}
          value={money(l.amountKes)}
        />
      ))}
      {quote.cleaningFeeKes ? <ReceiptPrinter.Row label="Cleaning fee" value={money(quote.cleaningFeeKes)} /> : null}
      <ReceiptPrinter.Divider />
      <ReceiptPrinter.Total value={money(quote.totalKes)} />
      <ReceiptPrinter.Row label="Approx." value={other(quote.totalKes)} className="opacity-80" />
    </>
  );
}

/**
 * Live price quote as a printed receipt. Whenever the dates, guests or
 * currency change, the slip feeds out again. With no dates yet, the printer
 * idles with a prompt. Reduced motion: the receipt simply updates.
 */
export function StayQuoteReceipt({
  quote,
  title,
  refCode,
  checkInTime,
  checkOutTime,
  idleLabel,
}: {
  quote: StayQuote | null;
  title: string;
  refCode: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  /** Printer screen text before a quote exists ("Choose your dates"). */
  idleLabel: string;
}) {
  const reduce = useReducedMotion();
  const { currency } = useCurrency();
  const key = quote ? `${quote.checkIn}|${quote.checkOut}|${quote.guests}|${quote.totalKes}|${currency}` : null;

  const [stage, setStage] = useState<ReceiptPrinterStage>("processing");
  const [printedKey, setPrintedKey] = useState<string | null>(null);
  // A new quote restarts the print (state adjusted during render, not in an effect).
  if (key !== printedKey) {
    setPrintedKey(key);
    setStage(key && reduce ? "complete" : "processing");
  }

  useEffect(() => {
    if (!key || reduce) return;
    const t1 = setTimeout(() => setStage("printing"), PROCESSING_MS);
    const t2 = setTimeout(() => setStage("complete"), PROCESSING_MS + PRINTING_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [key, reduce]);

  const status = !quote ? idleLabel : stage === "processing" ? "Pricing your stay" : stage === "printing" ? "Printing your quote" : "Your quote";

  return (
    <ReceiptPrinter.Root stage={stage} animate={!!quote} aria-label="Price quote" className="mx-auto">
      <ReceiptPrinter.Machine>
        <ReceiptPrinter.Header>
          <ReceiptPrinter.Status>{status}</ReceiptPrinter.Status>
        </ReceiptPrinter.Header>
        <ReceiptPrinter.Screen>
          <p className="truncate font-mono text-[0.7rem] uppercase tracking-[0.2em] opacity-80">
            {quote ? `${quote.nights} night${quote.nights === 1 ? "" : "s"} · ${quote.guests} guest${quote.guests === 1 ? "" : "s"}` : "Stay quote"}
          </p>
        </ReceiptPrinter.Screen>
      </ReceiptPrinter.Machine>
      {quote ? (
        <ReceiptPrinter.Output className="h-auto">
          <ReceiptPrinter.Paper className="min-h-0">
            <ReceiptPrinter.Brand subtitle="Stay quote" />
            <p className="mb-3 text-center text-xs leading-snug">{title}</p>
            <StayReceiptLines quote={quote} checkInTime={checkInTime} checkOutTime={checkOutTime} />
            <p className="mt-4 text-center text-[0.65rem] leading-relaxed opacity-70">
              Quote only — not yet a booking. Nothing to pay now.
            </p>
            <ReceiptPrinter.Barcode value={`${refCode ?? title}-${quote.checkIn}-${quote.checkOut}`} label={refCode ? `Quote ${refCode}` : "Quote"} />
          </ReceiptPrinter.Paper>
        </ReceiptPrinter.Output>
      ) : null}
    </ReceiptPrinter.Root>
  );
}
