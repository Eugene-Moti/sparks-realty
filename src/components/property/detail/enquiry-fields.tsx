"use client";

import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { useEffect, useState } from "react";
import { type FieldValues, type Path, useFormContext } from "react-hook-form";
import type { ReceiptPrinterStage } from "@/components/motion/receipt-printer";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PHONE_COUNTRIES } from "@/lib/validation/phone";

/** Fields every listing form shares. */
type ContactShape = {
  full_name: string;
  phone_country: string;
  phone: string;
  email: string;
  message: string;
};

/** Name, phone (country code + number), optional email and message. Use inside a react-hook-form FormProvider. */
export function ContactFields<T extends FieldValues & ContactShape>({
  messageLabel,
  messagePlaceholder,
  messageHint = "Optional",
  messageRows = 3,
}: {
  messageLabel: string;
  messagePlaceholder: string;
  /** Hint under the message box (default "Optional"). */
  messageHint?: string;
  messageRows?: number;
}) {
  const form = useFormContext<T>();
  const { errors } = form.formState;
  const err = (name: keyof ContactShape) => errors[name]?.message as string | undefined;
  const reg = (name: keyof ContactShape) => form.register(name as Path<T>);

  return (
    <div className="grid gap-5">
      <Field label="Your name" required error={err("full_name")}>
        {(ids) => <Input {...ids} autoComplete="name" {...reg("full_name")} />}
      </Field>

      <Field label="Phone / WhatsApp" required error={err("phone")} hint="We'll confirm by call or WhatsApp.">
        {(ids) => (
          <div className="flex gap-2">
            <label htmlFor={`${ids.id}-cc`} className="sr-only">
              Country code
            </label>
            <Select id={`${ids.id}-cc`} className="w-34 shrink-0" autoComplete="tel-country-code" {...reg("phone_country")}>
              {PHONE_COUNTRIES.map((c) => (
                <option key={c.iso} value={c.code} label={`${c.iso} ${c.code}`}>
                  {c.label} ({c.code})
                </option>
              ))}
            </Select>
            <Input {...ids} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="712 345 678" {...reg("phone")} />
          </div>
        )}
      </Field>

      <Field label="Email" hint="Optional" error={err("email")}>
        {(ids) => <Input {...ids} type="email" inputMode="email" autoComplete="email" {...reg("email")} />}
      </Field>

      <Field label={messageLabel} hint={messageHint} error={err("message")}>
        {(ids) => <Textarea {...ids} rows={messageRows} placeholder={messagePlaceholder} {...reg("message")} />}
      </Field>
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="font-medium text-danger text-xs">
      {message}
    </p>
  ) : null;
}

/** "12 Dec 2026, 14:05" in Nairobi time — when a request was sent. */
export const sentAtFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Nairobi",
});

/**
 * Drives a confirmation slip: processing → printing → complete, once.
 * Reduced motion goes straight to complete.
 */
export function usePrintSequence(processingMs = 700, printingMs = 1850): ReceiptPrinterStage {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<ReceiptPrinterStage>(reduce ? "complete" : "processing");

  useEffect(() => {
    if (reduce) return;
    const t1 = setTimeout(() => setStage("printing"), processingMs);
    const t2 = setTimeout(() => setStage("complete"), processingMs + printingMs);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduce, processingMs, printingMs]);

  return reduce ? "complete" : stage;
}
