"use client";

import { ChipsField, FormSection, SelectField, SwitchField, TextField } from "@/components/admin/form-fields";
import type { Option } from "@/lib/admin/queries";
import { LISTING_TAGS } from "@/lib/admin/schemas/property";
import { furnishingLabels } from "@/lib/labels";
import { AMENITIES } from "@/lib/search/filters";
import type { Furnishing } from "@/types/db";
import type { EditorValues } from "./editor-types";

const FURNISHING_OPTIONS = (Object.keys(furnishingLabels) as Furnishing[]).map((f) => ({ value: f, label: furnishingLabels[f] }));

export function DetailsTab({ agents }: { agents: Option[] }) {
  return (
    <div className="flex flex-col gap-6">
      <FormSection title="Rooms & size" description="Leave anything you don't know blank — it simply won't show.">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          <TextField<EditorValues> name="bedrooms" label="Bedrooms" inputMode="numeric" />
          <TextField<EditorValues> name="bathrooms" label="Bathrooms" inputMode="numeric" />
          <TextField<EditorValues> name="ensuites" label="Ensuites" inputMode="numeric" />
          <TextField<EditorValues> name="parking_spaces" label="Parking spaces" inputMode="numeric" />
          <TextField<EditorValues> name="floor_area_sqm" label="Floor area (m²)" inputMode="decimal" />
          <TextField<EditorValues> name="land_size_acres" label="Land (acres)" inputMode="decimal" />
          <TextField<EditorValues> name="year_built" label="Year built" inputMode="numeric" placeholder="e.g. 2019" />
          <SelectField<EditorValues> name="furnishing" label="Furnishing" options={FURNISHING_OPTIONS} placeholder="Not stated" />
          <TextField<EditorValues> name="available_from" label="Available from" type="date" hint="Blank = available now." />
        </div>
        <SwitchField<EditorValues> name="dsq" label="Has a DSQ" hint="Domestic staff quarters." />
      </FormSection>

      <FormSection title="Amenities" description="Tick everything that applies — visitors filter by these.">
        <ChipsField<EditorValues> name="amenities" label="Amenities" options={AMENITIES} />
      </FormSection>

      <FormSection title="Highlights" description="Badges and placement on the website.">
        <SwitchField<EditorValues> name="is_featured" label="Featured" hint="Shown first on the homepage and marked “Featured”." />
        <ChipsField<EditorValues> name="tags" label="Tags" options={LISTING_TAGS} hint="“New” and “Price drop” appear as badges on the card." />
        <SelectField<EditorValues>
          name="agent_id"
          label="Agent"
          options={agents}
          placeholder="Sparks Properties office (no agent)"
          hint="Their photo, phone and WhatsApp appear on the listing."
        />
      </FormSection>
    </div>
  );
}
