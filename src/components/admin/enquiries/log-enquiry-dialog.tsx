"use client";

import { type FormEvent, useState } from "react";
import { useAction } from "@/components/admin/use-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { logEnquiry } from "@/lib/admin/actions/enquiries";
import { enquiryKindLabels, LOG_CHANNELS, logChannelLabels } from "@/lib/admin/labels";
import type { Option } from "@/lib/admin/queries";
import { PHONE_COUNTRIES } from "@/lib/validation/phone";
import type { EnquiryKind } from "@/types/db";

type Errors = Record<string, string | undefined>;

export function LogEnquiryDialog({
  open,
  onOpenChange,
  agents,
  listings,
  onLogged,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  agents: Option[];
  listings: Option[];
  onLogged: () => void;
}) {
  const { pending, run } = useAction();
  const [errors, setErrors] = useState<Errors>({});

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const d = new FormData(form);
    const values = {
      full_name: String(d.get("full_name") ?? ""),
      phone_country: String(d.get("phone_country") ?? "+254"),
      phone: String(d.get("phone") ?? ""),
      email: String(d.get("email") ?? ""),
      kind: String(d.get("kind") ?? "general"),
      channel: String(d.get("channel") ?? "phone"),
      property_id: String(d.get("property_id") ?? ""),
      message: String(d.get("message") ?? ""),
      assigned_to: String(d.get("assigned_to") ?? ""),
      consent_given: d.get("consent_given") === "on",
      marketing_opt_in: d.get("marketing_opt_in") === "on",
    };
    await run(() => logEnquiry(values), {
      success: "Enquiry logged.",
      onSuccess: () => {
        setErrors({});
        form.reset();
        onOpenChange(false);
        onLogged();
      },
      onError: (r) => setErrors(Object.fromEntries(Object.entries(r.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log an enquiry</DialogTitle>
          <DialogDescription>For leads that came by phone, WhatsApp, walk-in or social media. It goes straight to “Contacted”.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Client name" required error={errors.full_name} className="sm:col-span-2">
              {(ids) => <Input {...ids} name="full_name" autoComplete="off" className="h-11 text-sm" />}
            </Field>
            <Field label="Phone / WhatsApp" error={errors.phone}>
              {(ids) => (
                <div className="flex gap-2">
                  <Select name="phone_country" aria-label="Country code" defaultValue="+254" className="w-28 shrink-0 [&_select]:h-11 [&_select]:text-sm">
                    {PHONE_COUNTRIES.map((c) => (
                      <option key={c.iso} value={c.code} label={`${c.iso} ${c.code}`}>
                        {c.label} ({c.code})
                      </option>
                    ))}
                  </Select>
                  <Input {...ids} name="phone" type="tel" inputMode="tel" placeholder="712 345 678" className="h-11 text-sm" />
                </div>
              )}
            </Field>
            <Field label="Email" error={errors.email}>
              {(ids) => <Input {...ids} name="email" type="email" className="h-11 text-sm" />}
            </Field>
            <Field label="How they reached us" error={errors.channel}>
              {(ids) => (
                <Select
                  {...ids}
                  name="channel"
                  defaultValue="phone"
                  options={LOG_CHANNELS.map((c) => ({ value: c, label: logChannelLabels[c] }))}
                  className="[&_select]:h-11 [&_select]:text-sm"
                />
              )}
            </Field>
            <Field label="Type" error={errors.kind}>
              {(ids) => (
                <Select
                  {...ids}
                  name="kind"
                  defaultValue="general"
                  options={(Object.keys(enquiryKindLabels) as EnquiryKind[]).map((k) => ({ value: k, label: enquiryKindLabels[k] }))}
                  className="[&_select]:h-11 [&_select]:text-sm"
                />
              )}
            </Field>
            <Field label="Listing" hint="Optional" error={errors.property_id} className="sm:col-span-2">
              {(ids) => <Select {...ids} name="property_id" placeholder="Not about a specific listing" options={listings} className="[&_select]:h-11 [&_select]:text-sm" />}
            </Field>
            <Field label="Assign to" hint="Defaults to you" error={errors.assigned_to} className="sm:col-span-2">
              {(ids) => <Select {...ids} name="assigned_to" placeholder="Me" options={agents} className="[&_select]:h-11 [&_select]:text-sm" />}
            </Field>
            <Field label="What they're looking for" error={errors.message} className="sm:col-span-2">
              {(ids) => <Textarea {...ids} name="message" rows={3} placeholder="e.g. 3-bed to rent in Kileleshwa, up to 180k, moving in January." className="text-sm" />}
            </Field>
          </div>

          <fieldset className="flex flex-col gap-3 rounded-2xl border border-border p-4">
            <legend className="px-1 font-medium text-sm">Consent</legend>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="consent_given" className="mt-0.5 size-4 accent-green-600" aria-describedby="log-consent-err" />
              <span>
                The client agreed to Sparks Properties keeping their details to help with this enquiry.
                <span aria-hidden="true" className="ml-0.5 text-accent">
                  *
                </span>
              </span>
            </label>
            {errors.consent_given ? (
              <p id="log-consent-err" role="alert" className="font-medium text-danger text-xs">
                {errors.consent_given}
              </p>
            ) : null}
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="marketing_opt_in" className="mt-0.5 size-4 accent-green-600" />
              <span>They asked to receive property alerts and news.</span>
            </label>
          </fieldset>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="green-solid" disabled={pending}>
              {pending ? "Saving…" : "Log enquiry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
