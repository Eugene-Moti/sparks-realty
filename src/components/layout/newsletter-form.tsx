"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { DynamicButton, type DynamicButtonState } from "@/components/motion/dynamic-button";
import { ConsentFields } from "@/components/privacy/consent-fields";
import { Input } from "@/components/ui/input";
import { consentDefaults, HONEYPOT_FIELD } from "@/lib/validation/consent";
import { track } from "@/lib/analytics";
import { type SubscribeValues, subscribeSchema } from "@/lib/validation/subscribe";

type FormValues = SubscribeValues & { [HONEYPOT_FIELD]?: string };

/** Footer signup for new-listing alerts → /api/subscribe → saved_searches. */
export function NewsletterForm() {
  const [state, setState] = useState<DynamicButtonState>("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: { email: "", ...consentDefaults, [HONEYPOT_FIELD]: "" },
  });
  const emailError = form.formState.errors.email?.message;

  async function onSubmit(values: FormValues) {
    setState("loading");
    setServerError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: { ok: boolean; error?: string } = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Something went wrong.");
      setState("success");
      track("newsletter_signup", { page_path: window.location.pathname });
      form.reset();
      setTimeout(() => setState("idle"), 4000);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="relative flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <Input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@email.com"
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? "newsletter-email-error" : undefined}
            className="bg-ink-3/70 sm:flex-1"
            {...form.register("email", {
              onChange: () => state === "error" && setState("idle"),
            })}
          />
          <DynamicButton
            state={state}
            size="lg"
            className="h-12"
            labels={{ idle: "Subscribe", loading: "Subscribing…", success: "You're in", error: "Try again" }}
          />
        </div>
        {emailError ? (
          <p id="newsletter-email-error" role="alert" className="font-medium text-danger text-xs">
            {emailError}
          </p>
        ) : null}
        <ConsentFields />
        {serverError ? (
          <p role="alert" className="text-danger text-xs">
            {serverError}
          </p>
        ) : null}
      </form>
    </FormProvider>
  );
}
