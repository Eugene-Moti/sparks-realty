"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Controller, FormProvider, useForm, type UseFormReturn, useWatch } from "react-hook-form";
import { ConsentFields } from "@/components/privacy/consent-fields";
import { ContactFields, FieldError } from "@/components/property/detail/enquiry-fields";
import { Chip, ToggleGroup } from "@/components/ui/toggle-group";
import { consentDefaults, HONEYPOT_FIELD } from "@/lib/validation/consent";
import { CONTACT_TOPICS, type ContactTopic, type ContactValues, contactSchema, topicLabel } from "@/lib/validation/contact";
import { toE164 } from "@/lib/validation/phone";
import { SiteEnquirySlip, SubmitRow, useSiteEnquiry } from "./site-enquiry";

type FormValues = ContactValues & { [HONEYPOT_FIELD]?: string };

const defaults: FormValues = {
  intent: "contact",
  topic: "general",
  full_name: "",
  phone_country: "+254",
  phone: "",
  email: "",
  message: "",
  ...consentDefaults,
  [HONEYPOT_FIELD]: "",
};

/** Links like /contact?intent=viewing pre-select a topic. */
const URL_TOPICS: Record<string, ContactTopic> = {
  viewing: "viewing",
  "video-viewing": "video_viewing",
  buy: "buying",
  rent: "renting",
  "short-stay": "short_stay",
};

const PLACEHOLDERS: Record<ContactTopic, string> = {
  general: "How can we help?",
  buying: "e.g. 3–4 bedrooms in Kileleshwa or Lavington, budget around KES 40M.",
  renting: "e.g. 2-bed apartment near Westlands, up to KES 120,000/month, from January.",
  short_stay: "e.g. 1-bed in Kilimani for 2 guests, 12–19 December.",
  viewing: "Which home, and which days and times suit you?",
  video_viewing: "Which home, your time zone, and the best times for a call.",
};

export function ContactForm() {
  const form = useForm<FormValues>({ resolver: zodResolver(contactSchema), defaultValues: defaults });
  const { state, setState, serverError, submitted, submit, reset } = useSiteEnquiry(form);
  const topic = useWatch({ control: form.control, name: "topic" });

  if (submitted) {
    const v = submitted.values;
    return (
      <SiteEnquirySlip
        kindLabel={v.topic === "viewing" || v.topic === "video_viewing" ? "Viewing request" : "Enquiry"}
        heading={topicLabel(v.topic)}
        rows={[
          { label: "Name", value: v.full_name },
          { label: "Phone", value: toE164(v.phone_country, v.phone) ?? v.phone },
          ...(v.email ? [{ label: "Email", value: v.email }] : []),
        ]}
        id={submitted.id}
        submittedAt={submitted.submittedAt}
        nextStep="An agent will call or WhatsApp you shortly."
        whatsappText={`Hi Sparks Properties, I've just sent a message from your website (${topicLabel(v.topic).toLowerCase()}).`}
        onReset={() => reset()}
      />
    );
  }

  return (
    <FormProvider {...form}>
      <Suspense fallback={null}>
        <TopicFromUrl form={form} />
      </Suspense>
      <form
        onSubmit={form.handleSubmit(submit)}
        onChange={() => state === "error" && setState("idle")}
        noValidate
        className="relative flex flex-col gap-6"
      >
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 font-medium text-sm">What&apos;s it about?</legend>
          <Controller
            control={form.control}
            name="topic"
            render={({ field }) => (
              <ToggleGroup
                type="single"
                value={field.value}
                onValueChange={(v) => v && field.onChange(v)}
                aria-label="Topic"
                className="flex flex-wrap gap-2"
              >
                {CONTACT_TOPICS.map((t) => (
                  <Chip key={t.value} value={t.value}>
                    {t.label}
                  </Chip>
                ))}
              </ToggleGroup>
            )}
          />
          <FieldError message={form.formState.errors.topic?.message} />
        </fieldset>

        <ContactFields<FormValues>
          messageLabel="Your message"
          messageHint={topic === "general" ? "Required" : "Optional"}
          messageRows={4}
          messagePlaceholder={PLACEHOLDERS[topic]}
        />
        <ConsentFields />
        <SubmitRow
          state={state}
          serverError={serverError}
          note="We reply within office hours — usually the same day."
          label="Send message"
          icon={<PaperPlaneTiltIcon weight="bold" />}
        />
      </form>
    </FormProvider>
  );
}

/** Reads ?intent= once (inside Suspense so the page stays static). */
function TopicFromUrl({ form }: { form: UseFormReturn<FormValues> }) {
  const params = useSearchParams();
  const fromUrl = URL_TOPICS[params.get("intent") ?? params.get("topic") ?? ""];
  useEffect(() => {
    if (fromUrl) form.setValue("topic", fromUrl);
  }, [fromUrl, form]);
  return null;
}
