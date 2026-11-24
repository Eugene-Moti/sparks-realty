"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheckIcon, ChatCircleTextIcon, VideoCameraIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { useEffect, useRef, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { easeOut } from "@/components/motion/easing";
import { DynamicButton, type DynamicButtonState } from "@/components/motion/dynamic-button";
import { ReceiptPrinter } from "@/components/motion/receipt-printer";
import { ConsentFields } from "@/components/privacy/consent-fields";
import { useContact } from "@/components/providers/contact-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Chip, SegmentedGroup, SegmentedItem, ToggleGroup } from "@/components/ui/toggle-group";
import { siteConfig } from "@/config/site";
import { cn } from "@/helpers/classname-helper";
import { whatsappLink } from "@/lib/format";
import { consentDefaults, HONEYPOT_FIELD } from "@/lib/validation/consent";
import { toE164 } from "@/lib/validation/phone";
import {
  addDays,
  type ListingEnquiryResponse,
  type ListingEnquiryValues,
  listingEnquirySchema,
  modeLabel,
  nairobiToday,
  slotLabel,
  VIEWING_MODES,
  VIEWING_SLOTS,
} from "@/lib/validation/viewing";
import { ContactFields, FieldError, sentAtFmt, usePrintSequence } from "./enquiry-fields";
import { track } from "@/lib/analytics";
import type { ViewingListing } from "./viewing-context";

type FormValues = ListingEnquiryValues & { [HONEYPOT_FIELD]?: string };

type Submitted = {
  id: string;
  submittedAt: string;
  values: FormValues;
};

const DAYS_SHOWN = 14;
const dayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });
const longDateFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const asDate = (iso: string) => new Date(`${iso}T12:00:00Z`);

export default function ViewingDialog({
  listing,
  open,
  onOpenChange,
}: {
  listing: ViewingListing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const isViewing = listing.intent === "viewing";

  // Start fresh next time the dialog opens after a completed request.
  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next && submitted) setTimeout(() => setSubmitted(null), 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl" aria-describedby="viewing-desc">
        <DialogHeader>
          <p className="eyebrow text-accent">{listing.refCode ?? "Sparks Properties"}</p>
          <DialogTitle>{isViewing ? "Book a viewing" : "Ask about this home"}</DialogTitle>
          <DialogDescription id="viewing-desc">
            {listing.title}
            {listing.areaName ? ` · ${listing.areaName}` : ""}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <ViewingSlip listing={listing} submitted={submitted} onDone={() => handleOpenChange(false)} />
        ) : (
          <ListingEnquiryForm listing={listing} onSubmitted={setSubmitted} />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

function ListingEnquiryForm({
  listing,
  onSubmitted,
}: {
  listing: ViewingListing;
  onSubmitted: (s: Submitted) => void;
}) {
  const isViewing = listing.intent === "viewing";
  const [state, setState] = useState<DynamicButtonState>("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  // The dialog only renders in the browser, so "today" is the visitor's real today (in Nairobi).
  const [today] = useState(() => nairobiToday());
  const days = Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(today, i));

  const form = useForm<FormValues>({
    resolver: zodResolver(listingEnquirySchema),
    defaultValues: {
      intent: listing.intent,
      property_id: listing.id,
      full_name: "",
      phone_country: "+254",
      phone: "",
      email: "",
      preferred_date: "",
      preferred_time: "",
      viewing_mode: "in_person",
      message: "",
      ...consentDefaults,
      [HONEYPOT_FIELD]: "",
    },
  });
  const { errors } = form.formState;

  async function onSubmit(values: FormValues) {
    setState("loading");
    setServerError(null);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: ListingEnquiryResponse = await res.json();
      if (!data.ok) {
        if (data.fieldErrors) {
          for (const [name, messages] of Object.entries(data.fieldErrors)) {
            if (messages?.[0]) form.setError(name as keyof FormValues, { message: messages[0] });
          }
        }
        throw new Error(data.error);
      }
      setState("success");
      track(isViewing ? "viewing_request" : "listing_enquiry", { listing_ref: listing.refCode, viewing_mode: isViewing ? values.viewing_mode : undefined });
      // Let "Sent ✓" register before the printer takes over.
      setTimeout(() => onSubmitted({ id: data.id, submittedAt: data.submittedAt, values }), 650);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setState("error");
    }
  }

  const resetError = () => state === "error" && setState("idle");

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} onChange={resetError} noValidate className="relative flex flex-col gap-6">
        {isViewing ? (
          <>
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 font-medium text-sm">
                Preferred day<span aria-hidden="true" className="ml-0.5 text-accent">*</span>
              </legend>
              <Controller
                control={form.control}
                name="preferred_date"
                render={({ field }) => (
                  <ToggleGroup
                    type="single"
                    value={field.value}
                    onValueChange={(v) => v && field.onChange(v)}
                    aria-label="Preferred day"
                    aria-invalid={errors.preferred_date ? true : undefined}
                    className="-mx-1 flex-nowrap overflow-x-auto px-1 pt-1 pb-2 scrollbar-none"
                    data-lenis-prevent
                  >
                    {days.map((d, i) => (
                      <Chip
                        key={d}
                        value={d}
                        aria-label={longDateFmt.format(asDate(d))}
                        className="h-auto min-w-16 shrink-0 flex-col gap-0.5 rounded-2xl px-3 py-2.5"
                      >
                        <span className="text-[0.65rem] uppercase tracking-widest opacity-70">
                          {i === 0 ? "Today" : i === 1 ? "Tmrw" : dayFmt.format(asDate(d))}
                        </span>
                        <span className="font-display text-xl leading-none">{dateFmt.format(asDate(d))}</span>
                        <span className="text-[0.65rem] opacity-70">{monthFmt.format(asDate(d))}</span>
                      </Chip>
                    ))}
                  </ToggleGroup>
                )}
              />
              <FieldError message={errors.preferred_date?.message} />
            </fieldset>

            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 font-medium text-sm">
                Time of day<span aria-hidden="true" className="ml-0.5 text-accent">*</span>
              </legend>
              <Controller
                control={form.control}
                name="preferred_time"
                render={({ field }) => (
                  <ToggleGroup
                    type="single"
                    value={field.value}
                    onValueChange={(v) => v && field.onChange(v)}
                    aria-label="Time of day"
                    className="grid grid-cols-2 sm:grid-cols-4"
                  >
                    {VIEWING_SLOTS.map((s) => (
                      <Chip key={s.value} value={s.value} className="h-auto flex-col gap-0 rounded-2xl px-3 py-2">
                        <span>{s.label}</span>
                        <span className="font-normal text-[0.7rem] opacity-70">{s.hint}</span>
                      </Chip>
                    ))}
                  </ToggleGroup>
                )}
              />
              <FieldError message={errors.preferred_time?.message} />
            </fieldset>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span id="viewing-mode-label" className="font-medium text-sm">
                How would you like to view?
              </span>
              <Controller
                control={form.control}
                name="viewing_mode"
                render={({ field }) => (
                  <SegmentedGroup
                    type="single"
                    value={field.value}
                    onValueChange={(v) => v && field.onChange(v)}
                    aria-labelledby="viewing-mode-label"
                    className="p-1"
                  >
                    {VIEWING_MODES.map((m) => (
                      <SegmentedItem key={m.value} value={m.value} className="h-9 gap-1.5 px-4 font-sans text-sm tracking-normal">
                        {m.value === "video" ? <VideoCameraIcon className="size-4" /> : <CalendarCheckIcon className="size-4" />}
                        {m.label}
                      </SegmentedItem>
                    ))}
                  </SegmentedGroup>
                )}
              />
            </div>
          </>
        ) : null}

        <ContactFields<FormValues>
          messageLabel={isViewing ? "Anything we should know?" : "Your question"}
          messagePlaceholder={
            isViewing
              ? "e.g. I'm relocating in January and need a school nearby."
              : "e.g. Is it still available? Are there similar homes nearby?"
          }
        />

        <ConsentFields />

        <div className="flex flex-col gap-3 border-hairline border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted text-xs leading-relaxed">
            {isViewing ? "Free, no obligation. An agent confirms the exact time." : "We usually reply within office hours."}
          </p>
          <DynamicButton
            state={state}
            variant="green-solid"
            size="lg"
            className="self-start sm:self-auto"
            idleIcon={isViewing ? <CalendarCheckIcon weight="bold" /> : <ChatCircleTextIcon weight="bold" />}
            labels={{
              idle: isViewing ? "Request viewing" : "Send question",
              loading: "Sending…",
              success: "Sent",
              error: "Try again",
            }}
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

// ---------------------------------------------------------------------------
// Printed slip
// ---------------------------------------------------------------------------

function ViewingSlip({ listing, submitted, onDone }: { listing: ViewingListing; submitted: Submitted; onDone: () => void }) {
  const reduce = useReducedMotion();
  const { whatsapp } = useContact();
  const stage = usePrintSequence();
  const doneRef = useRef<HTMLButtonElement>(null);
  const { values, id } = submitted;
  const isViewing = values.intent === "viewing";
  const shortRef = id.slice(0, 8).toUpperCase();

  useEffect(() => {
    if (stage === "complete") doneRef.current?.focus({ preventScroll: true });
  }, [stage]);

  const waMessage = `Hi Sparks Properties, I've just sent a ${isViewing ? "viewing request" : "question"} for ${listing.title}${
    listing.refCode ? ` (${listing.refCode})` : ""
  }. My request reference is ${shortRef}.`;

  return (
    <div className="flex flex-col items-center gap-6">
      <ReceiptPrinter.Root stage={stage} aria-label={isViewing ? "Viewing request slip" : "Enquiry slip"}>
        <ReceiptPrinter.Machine>
          <ReceiptPrinter.Header>
            <ReceiptPrinter.Status />
          </ReceiptPrinter.Header>
          <ReceiptPrinter.Screen>
            <p className="truncate font-mono text-[0.7rem] uppercase tracking-[0.2em] opacity-80">
              {isViewing ? "Viewing request" : "Enquiry"} · {shortRef}
            </p>
          </ReceiptPrinter.Screen>
        </ReceiptPrinter.Machine>
        <ReceiptPrinter.Output className="h-auto min-h-[30rem]">
          <ReceiptPrinter.Paper>
            <ReceiptPrinter.Brand subtitle={isViewing ? "Viewing request slip" : "Enquiry slip"} />
            <p className="mb-3 text-center text-xs leading-snug">{listing.title}</p>
            {listing.refCode ? <ReceiptPrinter.Row label="Listing" value={listing.refCode} /> : null}
            {isViewing ? (
              <>
                <ReceiptPrinter.Row label="Date" value={longDateFmt.format(asDate(values.preferred_date))} />
                <ReceiptPrinter.Row label="Time" value={slotLabel(values.preferred_time)} />
                <ReceiptPrinter.Row label="Viewing" value={modeLabel(values.viewing_mode)} />
              </>
            ) : null}
            <ReceiptPrinter.Divider />
            <ReceiptPrinter.Row label="Name" value={values.full_name} />
            <ReceiptPrinter.Row label="Phone" value={toE164(values.phone_country, values.phone) ?? values.phone} />
            <ReceiptPrinter.Row label="Agent" value={listing.agentName ?? "Sparks Properties team"} />
            <ReceiptPrinter.Divider />
            <ReceiptPrinter.Row label="Sent" value={sentAtFmt.format(new Date(submitted.submittedAt))} />
            <ReceiptPrinter.Total label="Status" value="Received" />
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
              {isViewing
                ? "We'll call or WhatsApp you to confirm the time."
                : "An agent will get back to you shortly."}{" "}
              Office hours: {siteConfig.contact.officeHours}.
            </p>
            <div className={cn("flex flex-wrap justify-center gap-2")}>
              <Button asChild variant="green-solid">
                <a href={whatsappLink(waMessage, whatsapp)} target="_blank" rel="noopener noreferrer">
                  <WhatsappLogoIcon weight="fill" /> Message us now
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
