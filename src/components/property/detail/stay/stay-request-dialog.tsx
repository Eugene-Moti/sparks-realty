"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheckIcon, PencilSimpleIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { easeOut } from "@/components/motion/easing";
import { DynamicButton, type DynamicButtonState } from "@/components/motion/dynamic-button";
import { ReceiptPrinter } from "@/components/motion/receipt-printer";
import { ConsentFields } from "@/components/privacy/consent-fields";
import { useContact } from "@/components/providers/contact-provider";
import { useCurrency } from "@/components/providers/currency-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { siteConfig } from "@/config/site";
import { formatShortWeekdayDate } from "@/lib/dates";
import { formatMoney, whatsappLink } from "@/lib/format";
import { quoteSummary, type StayQuote } from "@/lib/short-stay/stay";
import { consentDefaults, HONEYPOT_FIELD } from "@/lib/validation/consent";
import { toE164 } from "@/lib/validation/phone";
import { type StayRequestResponse, type StayRequestValues, stayRequestSchema } from "@/lib/validation/stay";
import { ContactFields, FieldError, sentAtFmt, usePrintSequence } from "../enquiry-fields";
import { useStay } from "./stay-context";
import { track } from "@/lib/analytics";
import { StayReceiptLines } from "./stay-quote";

type FormValues = StayRequestValues & { [HONEYPOT_FIELD]?: string };

type Submitted = { id: string; submittedAt: string; values: FormValues; quote: StayQuote | null };

/** "Request to book": contact details + consent → enquiry (kind short_stay) → printed booking slip. */
export default function StayRequestDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { listing } = useStay();
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next && submitted) setTimeout(() => setSubmitted(null), 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl" aria-describedby="stay-request-desc">
        <DialogHeader>
          <p className="eyebrow text-accent">{listing.refCode ?? "Sparks Properties"}</p>
          <DialogTitle>{submitted ? "Request sent" : "Request to book"}</DialogTitle>
          <DialogDescription id="stay-request-desc">
            {listing.title}
            {listing.areaName ? ` · ${listing.areaName}` : ""}
          </DialogDescription>
        </DialogHeader>
        {submitted ? (
          <BookingSlip submitted={submitted} onDone={() => handleOpenChange(false)} />
        ) : (
          <StayRequestForm onSubmitted={setSubmitted} onChangeDates={() => handleOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function StayRequestForm({ onSubmitted, onChangeDates }: { onSubmitted: (s: Submitted) => void; onChangeDates: () => void }) {
  const { listing, dates, guests, quote, goToCalendar } = useStay();
  const { currency, usdRate } = useCurrency();
  const [state, setState] = useState<DynamicButtonState>("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(stayRequestSchema),
    defaultValues: {
      intent: "stay",
      property_id: listing.id,
      check_in: dates.checkIn ?? "",
      check_out: dates.checkOut ?? "",
      guests,
      full_name: "",
      phone_country: "+254",
      phone: "",
      email: "",
      message: "",
      ...consentDefaults,
      [HONEYPOT_FIELD]: "",
    },
  });
  const { errors } = form.formState;
  const dateError = errors.check_in?.message ?? errors.check_out?.message ?? errors.guests?.message;

  async function onSubmit(values: FormValues) {
    setState("loading");
    setServerError(null);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: StayRequestResponse = await res.json();
      if (!data.ok) {
        if (data.fieldErrors) {
          for (const [name, messages] of Object.entries(data.fieldErrors)) {
            if (messages?.[0]) form.setError(name as keyof FormValues, { message: messages[0] });
          }
        }
        throw new Error(data.error);
      }
      setState("success");
      track("booking_request", { listing_ref: listing.refCode, guests: values.guests });
      // Prefer the server's quote (live rates); fall back to the one on screen (honeypot path).
      setTimeout(() => onSubmitted({ id: data.id, submittedAt: data.submittedAt, values, quote: data.quote ?? quote }), 650);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setState("error");
    }
  }

  const resetError = () => state === "error" && setState("idle");

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} onChange={resetError} noValidate className="flex flex-col gap-6">
        {/* The stay being requested, with a way back to the calendar. */}
        <div className="flex flex-col gap-3 rounded-2xl border border-hairline bg-surface-2/50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">
                {dates.checkIn && dates.checkOut
                  ? `${formatShortWeekdayDate(dates.checkIn)} → ${formatShortWeekdayDate(dates.checkOut)}`
                  : "No dates chosen"}
              </p>
              <p className="text-muted text-sm">
                {quote ? `${quote.nights} night${quote.nights === 1 ? "" : "s"} · ` : ""}
                {guests} guest{guests === 1 ? "" : "s"}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChangeDates();
                setTimeout(goToCalendar, 250);
              }}
            >
              <PencilSimpleIcon /> Change
            </Button>
          </div>
          {quote ? (
            <p className="flex items-baseline justify-between gap-3 border-hairline border-t pt-3 text-sm">
              <span className="text-muted">Estimated total</span>
              <span className="font-medium font-mono">{formatMoney(quote.totalKes, currency, usdRate)}</span>
            </p>
          ) : null}
          <FieldError message={dateError} />
        </div>

        <ContactFields<FormValues>
          messageLabel="Anything we should know?"
          messagePlaceholder="e.g. Arriving on a late flight, travelling with a baby, need airport pickup."
        />

        <ConsentFields />

        <div className="flex flex-col gap-3 border-hairline border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted text-xs leading-relaxed">No payment now. We confirm availability, then share how to pay.</p>
          <DynamicButton
            state={state}
            variant="green-solid"
            size="lg"
            className="self-start sm:self-auto"
            idleIcon={<CalendarCheckIcon weight="bold" />}
            labels={{ idle: "Request to book", loading: "Sending…", success: "Sent", error: "Try again" }}
          />
        </div>
        {serverError ? (
          <p role="alert" className="text-danger text-sm">
            {serverError}
          </p>
        ) : null}
      </form>
    </FormProvider>
  );
}

function BookingSlip({ submitted, onDone }: { submitted: Submitted; onDone: () => void }) {
  const reduce = useReducedMotion();
  const { listing, stay } = useStay();
  const { whatsapp } = useContact();
  const stage = usePrintSequence();
  const doneRef = useRef<HTMLButtonElement>(null);
  const { values, id, quote } = submitted;
  const shortRef = id.slice(0, 8).toUpperCase();

  useEffect(() => {
    if (stage === "complete") doneRef.current?.focus({ preventScroll: true });
  }, [stage]);

  const waMessage = [
    `Hi Sparks Properties, I've just sent a booking request for ${listing.title}${listing.refCode ? ` (${listing.refCode})` : ""}.`,
    `My request reference is ${shortRef}.`,
    quote ? `${formatShortWeekdayDate(quote.checkIn)} → ${formatShortWeekdayDate(quote.checkOut)}, ${quote.guests} guest${quote.guests === 1 ? "" : "s"}: ${quoteSummary(quote)}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="flex flex-col items-center gap-6">
      <ReceiptPrinter.Root stage={stage} aria-label="Booking request slip">
        <ReceiptPrinter.Machine>
          <ReceiptPrinter.Header>
            <ReceiptPrinter.Status />
          </ReceiptPrinter.Header>
          <ReceiptPrinter.Screen>
            <p className="truncate font-mono text-[0.7rem] uppercase tracking-[0.2em] opacity-80">Booking request · {shortRef}</p>
          </ReceiptPrinter.Screen>
        </ReceiptPrinter.Machine>
        <ReceiptPrinter.Output className="h-auto min-h-[30rem]">
          <ReceiptPrinter.Paper>
            <ReceiptPrinter.Brand subtitle="Booking request" />
            <p className="mb-3 text-center text-xs leading-snug">{listing.title}</p>
            {listing.refCode ? <ReceiptPrinter.Row label="Listing" value={listing.refCode} /> : null}
            {quote ? (
              <StayReceiptLines quote={quote} checkInTime={stay.checkInTime} checkOutTime={stay.checkOutTime} />
            ) : (
              <>
                <ReceiptPrinter.Row label="Check-in" value={values.check_in} />
                <ReceiptPrinter.Row label="Check-out" value={values.check_out} />
                <ReceiptPrinter.Row label="Guests" value={values.guests} />
                <ReceiptPrinter.Row label="Price" value="On request" />
              </>
            )}
            <ReceiptPrinter.Divider />
            <ReceiptPrinter.Row label="Name" value={values.full_name} />
            <ReceiptPrinter.Row label="Phone" value={toE164(values.phone_country, values.phone) ?? values.phone} />
            <ReceiptPrinter.Row label="Host" value={listing.agentName ?? "Sparks Properties team"} />
            <ReceiptPrinter.Row label="Sent" value={sentAtFmt.format(new Date(submitted.submittedAt))} />
            <ReceiptPrinter.Divider />
            <ReceiptPrinter.Total label="Status" value="Awaiting confirmation" />
            <ReceiptPrinter.Barcode value={id} label={`Ref ${shortRef}`} />
          </ReceiptPrinter.Paper>
        </ReceiptPrinter.Output>
      </ReceiptPrinter.Root>

      <AnimatePresence>
        {stage === "complete" ? (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut }}
            className="flex w-full flex-col items-center gap-4 text-center"
          >
            <p className="max-w-sm text-muted text-sm leading-relaxed">
              Your dates aren&apos;t held until we confirm. We&apos;ll call or WhatsApp you shortly. Office hours:{" "}
              {siteConfig.contact.officeHours}.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="green-solid">
                <a href={whatsappLink(waMessage, listing.agentWhatsapp || whatsapp)} target="_blank" rel="noopener noreferrer">
                  <WhatsappLogoIcon weight="fill" /> Confirm on WhatsApp
                </a>
              </Button>
              <Button ref={doneRef} variant="gold-outline" onClick={onDone}>
                Done
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
