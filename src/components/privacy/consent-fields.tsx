"use client";

import Link from "next/link";
import { useId } from "react";
import { type FieldValues, type Path, useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/helpers/classname-helper";
import { HONEYPOT_FIELD, type ConsentValues } from "@/lib/validation/consent";

type ConsentFieldsProps = {
  className?: string;
  /** Label override for the optional box (e.g. newsletter wording). */
  marketingLabel?: string;
  /** Hide the optional marketing box (rare; e.g. internal-only forms). */
  hideMarketing?: boolean;
};

/**
 * Required processing-consent checkbox + separate optional, unticked
 * "Send me property alerts and news" checkbox, plus a hidden honeypot.
 * Use inside a react-hook-form <FormProvider> whose schema extends `consentShape`.
 */
export function ConsentFields({ className, marketingLabel, hideMarketing }: ConsentFieldsProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ConsentValues & FieldValues>();
  // Unique per form: a page can hold several forms (footer signup + a dialog).
  const honeypotId = `${useId()}-${HONEYPOT_FIELD}`;
  const consentError = errors.consent_given?.message;

  return (
    <fieldset className={cn("flex flex-col gap-3", className)}>
      <legend className="sr-only">Privacy</legend>
      <Checkbox
        {...register("consent_given" as Path<ConsentValues>)}
        aria-required="true"
        error={typeof consentError === "string" ? consentError : undefined}
        label={
          <>
            I agree to Sparks Properties processing my details to respond to this enquiry, as set out
            in the{" "}
            <Link
              href="/privacy"
              target="_blank"
              className="text-accent underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            <span aria-hidden="true" className="ml-0.5 text-accent">
              *
            </span>
          </>
        }
      />
      {hideMarketing ? null : (
        <Checkbox
          {...register("marketing_opt_in" as Path<ConsentValues>)}
          label={marketingLabel ?? "Send me property alerts and news"}
          description="Optional. Unsubscribe any time."
        />
      )}
      {/* Honeypot: invisible to people, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={honeypotId}>Leave this field empty</label>
        <input
          id={honeypotId}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register(HONEYPOT_FIELD as Path<ConsentValues>)}
        />
      </div>
    </fieldset>
  );
}
