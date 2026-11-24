"use client";

import { MapPinIcon } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { FormSection, SelectField, TextAreaField, TextField } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedGroup, SegmentedItem } from "@/components/ui/toggle-group";
import type { Option } from "@/lib/admin/queries";
import { propertyTypeOptions } from "@/lib/labels";
import type { ListingType } from "@/types/db";
import type { EditorValues } from "./editor-types";

const LocationPicker = dynamic(() => import("./location-picker"), {
  ssr: false,
  loading: () => <Skeleton className="h-80 w-full rounded-2xl" />,
});

const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: "sale", label: "For sale" },
  { value: "rent", label: "To rent" },
  { value: "short_stay", label: "Short stay" },
];

const LIVE_STATUSES = [
  { value: "published", label: "Published — available" },
  { value: "under_offer", label: "Under offer" },
  { value: "sold", label: "Sold" },
  { value: "let", label: "Let" },
  { value: "archived", label: "Archived (hidden)" },
];

export function BasicsTab({ areas, isNew }: { areas: Option[]; isNew: boolean }) {
  const { control, setValue } = useFormContext<EditorValues>();
  const status = useWatch({ control, name: "status" });
  const [lat, lng] = useWatch({ control, name: ["latitude", "longitude"] });
  const [mapOpen, setMapOpen] = useState(false);
  const latN = lat ? Number(lat) : null;
  const lngN = lng ? Number(lng) : null;

  return (
    <div className="flex flex-col gap-6">
      <FormSection title="The listing" description="The title is the headline on cards, search results and WhatsApp shares.">
        <TextField<EditorValues>
          name="title"
          label="Title"
          required
          placeholder="e.g. 4 Bedroom Maisonette with DSQ, Kileleshwa"
          hint={isNew ? "Saving creates a draft. Only the team can see drafts." : undefined}
        />
        <div className="flex flex-col gap-2">
          <span id="lt-label" className="font-medium text-sm">
            Listing type
          </span>
          <Controller
            control={control}
            name="listing_type"
            render={({ field }) => (
              <SegmentedGroup
                type="single"
                value={field.value}
                onValueChange={(v) => v && field.onChange(v)}
                aria-labelledby="lt-label"
                className="w-fit p-1"
              >
                {LISTING_TYPES.map((t) => (
                  <SegmentedItem key={t.value} value={t.value} className="h-9 px-4 font-sans text-sm tracking-normal">
                    {t.label}
                  </SegmentedItem>
                ))}
              </SegmentedGroup>
            )}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField<EditorValues> name="property_type" label="Property type" options={propertyTypeOptions} required />
          {status === "draft" ? (
            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Status</span>
              <p className="flex h-11 items-center rounded-(--radius-control) border border-border border-dashed px-4 text-muted text-sm">
                Draft — use Publish when it&apos;s ready
              </p>
            </div>
          ) : (
            <SelectField<EditorValues>
              name="status"
              label="Status"
              options={LIVE_STATUSES}
              hint="Sold and let listings stay visible with a ribbon."
            />
          )}
        </div>
      </FormSection>

      <FormSection title="Location" description="Visitors see the area and an approximate circle on the map — never the exact pin.">
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField<EditorValues> name="area_id" label="Area" options={areas} placeholder="Choose an area" required />
          <TextField<EditorValues>
            name="address_line"
            label="Road / estate"
            placeholder="e.g. Kandara Road, Kileleshwa"
            hint="Shown publicly. Avoid house numbers."
          />
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-medium text-sm">
              <MapPinIcon className="text-accent" /> Map pin
              <span className="font-mono font-normal text-muted text-xs">
                {latN !== null && lngN !== null ? `${latN.toFixed(5)}, ${lngN.toFixed(5)}` : "Not set"}
              </span>
            </span>
            <div className="flex gap-2">
              {latN !== null ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setValue("latitude", "", { shouldDirty: true });
                    setValue("longitude", "", { shouldDirty: true });
                  }}
                >
                  Remove pin
                </Button>
              ) : null}
              <Button type="button" variant="ghost" size="sm" className="border border-border" onClick={() => setMapOpen((o) => !o)}>
                {mapOpen ? "Hide map" : latN !== null ? "Move pin" : "Pick on map"}
              </Button>
            </div>
          </div>
          {mapOpen ? (
            <LocationPicker
              lat={latN}
              lng={lngN}
              onChange={(la, ln) => {
                setValue("latitude", String(la), { shouldDirty: true });
                setValue("longitude", String(ln), { shouldDirty: true });
              }}
            />
          ) : null}
        </div>
      </FormSection>

      <FormSection title="Description" description="Write for a busy reader on a phone: lead with what makes it special.">
        <TextAreaField<EditorValues> name="summary" label="Summary" rows={2} maxLength={300} hint="One or two sentences under the title." />
        <TextAreaField<EditorValues>
          name="description_md"
          label="Full description"
          rows={10}
          hint="Blank line between paragraphs · start a line with “- ” for bullet points · **bold**"
        />
      </FormSection>
    </div>
  );
}
