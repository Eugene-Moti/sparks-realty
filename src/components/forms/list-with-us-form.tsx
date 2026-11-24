"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { HouseLineIcon } from "@phosphor-icons/react";
import { useId } from "react";
import { Controller, FormProvider, type Resolver, useForm, useWatch } from "react-hook-form";
import { ConsentFields } from "@/components/privacy/consent-fields";
import { ContactFields, FieldError } from "@/components/property/detail/enquiry-fields";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SegmentedGroup, SegmentedItem } from "@/components/ui/toggle-group";
import { propertyTypeLabels, propertyTypeOptions } from "@/lib/labels";
import { consentDefaults, HONEYPOT_FIELD } from "@/lib/validation/consent";
import { amountValue, LIST_PURPOSES, type ListWithUsValues, listWithUsSchema, purposeLabel } from "@/lib/validation/contact";
import { toE164 } from "@/lib/validation/phone";
import { SiteEnquirySlip, SubmitRow, useSiteEnquiry } from "./site-enquiry";

type FormValues = Omit<ListWithUsValues, "purpose" | "property_type"> & {
  purpose: ListWithUsValues["purpose"];
  property_type: ListWithUsValues["property_type"] | "";
  [HONEYPOT_FIELD]?: string;
};

const kes = new Intl.NumberFormat("en-KE");

const PRICE_LABEL: Record<ListWithUsValues["purpose"], string> = {
  sell: "Asking price",
  let: "Expected rent per month",
  short_stay: "Expected nightly rate",
};

export function ListWithUsForm({ areas }: { areas: string[] }) {
  const listId = useId();
  const form = useForm<FormValues>({
    // The select starts empty; the schema rejects "" with a friendly message.
    resolver: zodResolver(listWithUsSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      intent: "list_with_us",
      purpose: "sell",
      property_type: "",
      area: "",
      bedrooms: "",
      expected_price: "",
      full_name: "",
      phone_country: "+254",
      phone: "",
      email: "",
      message: "",
      ...consentDefaults,
      [HONEYPOT_FIELD]: "",
    },
  });
  const { state, setState, serverError, submitted, submit, reset } = useSiteEnquiry(form);
  const purpose = useWatch({ control: form.control, name: "purpose" });
  const { errors } = form.formState;

  if (submitted) {
    const v = submitted.values;
    const price = amountValue(v.expected_price);
    return (
      <SiteEnquirySlip
        kindLabel="Listing request"
        heading={`${purposeLabel(v.purpose)} · ${v.property_type ? propertyTypeLabels[v.property_type] : ""} in ${v.area}`}
        rows={[
          ...(v.bedrooms ? [{ label: "Bedrooms", value: v.bedrooms }] : []),
          ...(price ? [{ label: PRICE_LABEL[v.purpose].replace(/ per month| rate/, ""), value: `KES ${kes.format(price)}` }] : []),
          { label: "Name", value: v.full_name },
          { label: "Phone", value: toE164(v.phone_country, v.phone) ?? v.phone },
        ]}
        id={submitted.id}
        submittedAt={submitted.submittedAt}
        nextStep="A listing agent will call you to arrange a free visit and valuation."
        whatsappText="Hi Sparks Properties, I've just asked you to list my property."
        onReset={() => reset()}
      />
    );
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit((v) => submit(v))}
        onChange={() => state === "error" && setState("idle")}
        noValidate
        className="relative flex flex-col gap-6"
      >
        <div className="flex flex-col gap-3">
          <span id={`${listId}-purpose`} className="font-medium text-sm">
            I want to
          </span>
          <Controller
            control={form.control}
            name="purpose"
            render={({ field }) => (
              <SegmentedGroup
                type="single"
                value={field.value}
                onValueChange={(v) => v && field.onChange(v)}
                aria-labelledby={`${listId}-purpose`}
                className="w-fit max-w-full flex-wrap p-1"
              >
                {LIST_PURPOSES.map((p) => (
                  <SegmentedItem key={p.value} value={p.value} className="h-9 px-4 font-sans text-sm tracking-normal">
                    {p.label}
                  </SegmentedItem>
                ))}
              </SegmentedGroup>
            )}
          />
          <FieldError message={errors.purpose?.message} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Type of property" required error={errors.property_type?.message}>
            {(ids) => <Select {...ids} placeholder="Choose…" options={propertyTypeOptions} {...form.register("property_type")} />}
          </Field>
          <Field label="Area" required error={errors.area?.message} hint="e.g. Kileleshwa, Kilimani, Karen">
            {(ids) => (
              <>
                <Input {...ids} list={`${listId}-areas`} autoComplete="off" {...form.register("area")} />
                <datalist id={`${listId}-areas`}>
                  {areas.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </>
            )}
          </Field>
          <Field label="Bedrooms" hint="Optional" error={errors.bedrooms?.message}>
            {(ids) => <Input {...ids} inputMode="numeric" maxLength={2} {...form.register("bedrooms")} />}
          </Field>
          <Field label={PRICE_LABEL[purpose]} hint="Optional — we'll advise after a visit" error={errors.expected_price?.message}>
            {(ids) => (
              <div className="relative">
                <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-mono text-muted text-sm">
                  KES
                </span>
                <Input {...ids} inputMode="numeric" className="pl-14 font-mono" {...form.register("expected_price")} />
              </div>
            )}
          </Field>
        </div>

        <ContactFields<FormValues>
          messageLabel="About the property"
          messagePlaceholder="e.g. 4-bed maisonette with DSQ on Kandara Road, vacant from February. Title deed ready."
        />
        <ConsentFields />
        <SubmitRow
          state={state}
          serverError={serverError}
          note="Free valuation, no obligation. We agree fees with you in writing before marketing."
          label="Request a valuation"
          icon={<HouseLineIcon weight="bold" />}
        />
      </form>
    </FormProvider>
  );
}
