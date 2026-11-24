"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { AmountField, FormSection, SwitchField, TextField } from "@/components/admin/form-fields";
import type { EditorValues } from "./editor-types";

const PRICE_LABELS = {
  sale: { label: "Asking price", hint: "Total price in KES." },
  rent: { label: "Monthly rent", hint: "Per month, in KES." },
  short_stay: { label: "Nightly rate", hint: "Per night, in KES. Seasonal rates go in the Short stay tab." },
} as const;

export function PricingTab() {
  const { control } = useFormContext<EditorValues>();
  const [type, onRequest] = useWatch({ control, name: ["listing_type", "price_on_request"] });
  const copy = PRICE_LABELS[type];

  return (
    <div className="flex flex-col gap-6">
      <FormSection title="Price" description="Shown in KES, with USD for overseas buyers at the rate in Settings.">
        <AmountField<EditorValues> name="price_kes" label={copy.label} hint={copy.hint} required={!onRequest} placeholder="e.g. 35000000" />
        <SwitchField<EditorValues>
          name="price_on_request"
          label="Price on request"
          hint="Hides the price on the website and shows “Price on request” instead."
        />
      </FormSection>

      {type !== "short_stay" ? (
        <FormSection title="Extra costs" description="Helps buyers and tenants compare like for like.">
          <div className="grid gap-5 sm:grid-cols-2">
            <AmountField<EditorValues> name="service_charge_kes" label="Service charge (per month)" placeholder="e.g. 15000" />
            {type === "rent" ? (
              <TextField<EditorValues>
                name="deposit_months"
                label="Deposit (months of rent)"
                inputMode="decimal"
                placeholder="e.g. 2"
                hint="Used for the move-in cost estimate."
              />
            ) : null}
          </div>
        </FormSection>
      ) : null}
    </div>
  );
}
