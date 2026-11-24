"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { GlobeHemisphereEastIcon } from "@phosphor-icons/react";
import { useId } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { ConsentFields } from "@/components/privacy/consent-fields";
import { ContactFields, FieldError } from "@/components/property/detail/enquiry-fields";
import { useCurrency } from "@/components/providers/currency-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Chip, SegmentedGroup, SegmentedItem, ToggleGroup } from "@/components/ui/toggle-group";
import { consentDefaults, HONEYPOT_FIELD } from "@/lib/validation/consent";
import {
  amountValue,
  DIASPORA_GOALS,
  DIASPORA_TIMELINES,
  type DiasporaValues,
  diasporaSchema,
  goalLabel,
  timelineLabel,
} from "@/lib/validation/contact";
import { PHONE_COUNTRIES, toE164 } from "@/lib/validation/phone";
import { SiteEnquirySlip, SubmitRow, useSiteEnquiry } from "./site-enquiry";

type FormValues = DiasporaValues & { [HONEYPOT_FIELD]?: string };

const num = new Intl.NumberFormat("en-KE");

export function DiasporaForm() {
  const ids = useId();
  const { usdRate } = useCurrency();
  const form = useForm<FormValues>({
    resolver: zodResolver(diasporaSchema),
    defaultValues: {
      intent: "diaspora",
      country: "",
      goal: "buy_home",
      timeline: "soon",
      budget: "",
      budget_currency: "USD",
      video_call: true,
      full_name: "",
      phone_country: "+44",
      phone: "",
      email: "",
      message: "",
      ...consentDefaults,
      [HONEYPOT_FIELD]: "",
    },
  });
  const { state, setState, serverError, submitted, submit, reset } = useSiteEnquiry(form);
  const [currency, budget] = useWatch({ control: form.control, name: ["budget_currency", "budget"] });
  const { errors } = form.formState;
  const amount = amountValue(budget ?? "");
  const converted = amount ? (currency === "USD" ? `≈ KES ${num.format(Math.round(amount * usdRate))}` : `≈ USD ${num.format(Math.round(amount / usdRate))}`) : null;

  if (submitted) {
    const v = submitted.values;
    const a = amountValue(v.budget);
    return (
      <SiteEnquirySlip
        kindLabel="Diaspora enquiry"
        heading={`${goalLabel(v.goal)} · from ${v.country}`}
        rows={[
          { label: "Timeline", value: timelineLabel(v.timeline) },
          ...(a ? [{ label: "Budget", value: `${v.budget_currency} ${num.format(a)}` }] : []),
          { label: "Video call", value: v.video_call ? "Yes please" : "Not now" },
          { label: "Name", value: v.full_name },
          { label: "WhatsApp", value: toE164(v.phone_country, v.phone) ?? v.phone },
        ]}
        id={submitted.id}
        submittedAt={submitted.submittedAt}
        nextStep="We'll WhatsApp you to set up a call at a time that suits your time zone."
        whatsappText="Hi Sparks Properties, I'm abroad and just sent a diaspora enquiry from your website."
        onReset={() => reset()}
      />
    );
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        onChange={() => state === "error" && setState("idle")}
        noValidate
        className="relative flex flex-col gap-6"
      >
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 font-medium text-sm">What would you like to do?</legend>
          <Controller
            control={form.control}
            name="goal"
            render={({ field }) => (
              <ToggleGroup type="single" value={field.value} onValueChange={(v) => v && field.onChange(v)} aria-label="Goal" className="flex flex-wrap gap-2">
                {DIASPORA_GOALS.map((g) => (
                  <Chip key={g.value} value={g.value}>
                    {g.label}
                  </Chip>
                ))}
              </ToggleGroup>
            )}
          />
          <FieldError message={errors.goal?.message} />
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Where are you based?" required error={errors.country?.message}>
            {(f) => (
              <>
                <Input {...f} list={`${ids}-countries`} autoComplete="country-name" placeholder="e.g. United Kingdom" {...form.register("country")} />
                <datalist id={`${ids}-countries`}>
                  {PHONE_COUNTRIES.filter((c) => c.iso !== "KE").map((c) => (
                    <option key={c.iso} value={c.label} />
                  ))}
                </datalist>
              </>
            )}
          </Field>
          <Field label="When?" error={errors.timeline?.message}>
            {(f) => <Select {...f} options={DIASPORA_TIMELINES.map((t) => ({ value: t.value, label: t.label }))} {...form.register("timeline")} />}
          </Field>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <label htmlFor={`${ids}-budget`} className="font-medium text-sm">
              Budget <span className="font-normal text-muted text-xs">(optional)</span>
            </label>
            <Controller
              control={form.control}
              name="budget_currency"
              render={({ field }) => (
                <SegmentedGroup type="single" value={field.value} onValueChange={(v) => v && field.onChange(v)} aria-label="Budget currency" className="p-0.5">
                  {(["USD", "KES"] as const).map((c) => (
                    <SegmentedItem key={c} value={c} className="h-8 px-3 font-mono text-xs tracking-normal">
                      {c}
                    </SegmentedItem>
                  ))}
                </SegmentedGroup>
              )}
            />
          </div>
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-mono text-muted text-sm">
              {currency}
            </span>
            <Input
              id={`${ids}-budget`}
              inputMode="numeric"
              className="pl-14 font-mono"
              aria-describedby={`${ids}-budget-hint`}
              aria-invalid={errors.budget ? true : undefined}
              {...form.register("budget")}
            />
          </div>
          <p id={`${ids}-budget-hint`} className="font-mono text-muted text-xs" aria-live="polite">
            {converted ?? `Rate used: KES ${usdRate.toFixed(2)} = $1`}
          </p>
          <FieldError message={errors.budget?.message} />
        </div>

        <ContactFields<FormValues>
          messageLabel="What are you looking for?"
          messagePlaceholder="e.g. A 3-bed apartment in Kilimani to let out, or a family home in Karen for when we move back in 2028."
        />
        <Checkbox {...form.register("video_call")} label="I'd like a live video-call viewing" description="We'll walk you through homes on WhatsApp or Google Meet." />
        <ConsentFields />
        <SubmitRow
          state={state}
          serverError={serverError}
          note="We'll suggest call times in your time zone. No obligation."
          label="Send my enquiry"
          icon={<GlobeHemisphereEastIcon weight="bold" />}
        />
      </form>
    </FormProvider>
  );
}
