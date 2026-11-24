"use client";

import { ArrowCounterClockwiseIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { DynamicButton, type DynamicButtonState } from "@/components/motion/dynamic-button";
import { easeOut } from "@/components/motion/easing";
import { ReceiptPrinter } from "@/components/motion/receipt-printer";
import { sentAtFmt, usePrintSequence } from "@/components/property/detail/enquiry-fields";
import { useContact } from "@/components/providers/contact-provider";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { whatsappLink } from "@/lib/format";
import { track } from "@/lib/analytics";
import type { SiteEnquiryResponse } from "@/lib/validation/contact";

export type SiteSubmitted<T> = { id: string; submittedAt: string; values: T };

/**
 * Posts a site-wide form to /api/contact and maps server field errors back
 * onto the form. Drives the DynamicButton state and the success hand-off.
 */
export function useSiteEnquiry<T extends FieldValues>(form: UseFormReturn<T>) {
  const [state, setState] = useState<DynamicButtonState>("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SiteSubmitted<T> | null>(null);

  async function submit(values: T) {
    setState("loading");
    setServerError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: SiteEnquiryResponse = await res.json();
      if (!data.ok) {
        for (const [name, messages] of Object.entries(data.fieldErrors ?? {})) {
          if (messages?.[0]) form.setError(name as Path<T>, { message: messages[0] });
        }
        throw new Error(data.error);
      }
      setState("success");
      const intent = (values as { intent?: string }).intent;
      track(intent === "list_with_us" ? "list_with_us_form" : intent === "diaspora" ? "diaspora_form" : "contact_form", {
        topic: (values as { topic?: string }).topic,
      });
      // Let "Sent ✓" register before the printer takes over.
      setTimeout(() => setSubmitted({ id: data.id, submittedAt: data.submittedAt, values }), 650);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setState("error");
    }
  }

  function reset() {
    setSubmitted(null);
    setState("idle");
    form.reset();
  }

  return { state, setState, serverError, submitted, submit, reset };
}

/** Footer row of every site form: reassurance note + the dynamic submit button + server error. */
export function SubmitRow({
  state,
  serverError,
  note,
  label,
  icon,
}: {
  state: DynamicButtonState;
  serverError: string | null;
  note: ReactNode;
  label: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-hairline border-t pt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted text-xs leading-relaxed">{note}</p>
        <DynamicButton
          state={state}
          variant="green-solid"
          size="lg"
          className="self-start sm:self-auto"
          idleIcon={icon}
          labels={{ idle: label }}
        />
      </div>
      <p role="alert" aria-live="assertive" className="text-danger text-sm empty:hidden">
        {serverError}
      </p>
    </div>
  );
}

export type SlipRow = { label: string; value: string };

/**
 * Printed confirmation after a site form: "Sending → Printing your slip →
 * Request received", with the enquiry reference as a barcode. Static under
 * reduced motion.
 */
export function SiteEnquirySlip({
  kindLabel,
  heading,
  rows,
  id,
  submittedAt,
  nextStep,
  whatsappText,
  onReset,
}: {
  kindLabel: string;
  heading: string;
  rows: SlipRow[];
  id: string;
  submittedAt: string;
  nextStep: string;
  whatsappText: string;
  onReset: () => void;
}) {
  const reduce = useReducedMotion();
  const { whatsapp } = useContact();
  const stage = usePrintSequence();
  const headingRef = useRef<HTMLParagraphElement>(null);
  const shortRef = id.slice(0, 8).toUpperCase();

  useEffect(() => {
    if (stage === "complete") headingRef.current?.focus({ preventScroll: true });
  }, [stage]);

  return (
    <div className="flex flex-col items-center gap-6">
      <ReceiptPrinter.Root stage={stage} aria-label={`${kindLabel} slip`}>
        <ReceiptPrinter.Machine>
          <ReceiptPrinter.Header>
            <ReceiptPrinter.Status />
          </ReceiptPrinter.Header>
          <ReceiptPrinter.Screen>
            <p className="truncate font-mono text-[0.7rem] uppercase tracking-[0.2em] opacity-80">
              {kindLabel} · {shortRef}
            </p>
          </ReceiptPrinter.Screen>
        </ReceiptPrinter.Machine>
        <ReceiptPrinter.Output className="h-auto min-h-[26rem]">
          <ReceiptPrinter.Paper>
            <ReceiptPrinter.Brand subtitle={`${kindLabel} slip`} />
            <p className="mb-3 text-center text-xs leading-snug">{heading}</p>
            {rows.map((r) => (
              <ReceiptPrinter.Row key={r.label} label={r.label} value={r.value} />
            ))}
            <ReceiptPrinter.Divider />
            <ReceiptPrinter.Row label="Sent" value={sentAtFmt.format(new Date(submittedAt))} />
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
            <p ref={headingRef} tabIndex={-1} className="font-display text-2xl outline-none">
              Thank you — we have it.
            </p>
            <p className="max-w-sm text-muted text-sm leading-relaxed">
              {nextStep} Office hours: {siteConfig.contact.officeHours}.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="green-solid">
                <a href={whatsappLink(`${whatsappText} My reference is ${shortRef}.`, whatsapp)} target="_blank" rel="noopener noreferrer">
                  <WhatsappLogoIcon weight="fill" /> Message us now
                </a>
              </Button>
              <Button variant="gold-outline" onClick={onReset}>
                <ArrowCounterClockwiseIcon /> Send another
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
