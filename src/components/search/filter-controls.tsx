"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { type ReactNode, useEffect, useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Chip, ToggleGroup } from "@/components/ui/toggle-group";
import { cn } from "@/helpers/classname-helper";
import { furnishingLabels, propertyTypeOptions } from "@/lib/labels";
import { AMENITIES, type FixedFilters } from "@/lib/search/filters";
import { FURNISHINGS, type SearchParamsState } from "@/lib/search/params";
import type { Furnishing, ListingType, PropertyType } from "@/types/db";
import { DateRangePicker } from "./date-range-picker";
import { PriceRange } from "./price-range";

export type FilterPatch = Partial<SearchParamsState>;

type FilterControlsProps = {
  value: SearchParamsState;
  onChange: (patch: FilterPatch) => void;
  fixed: FixedFilters;
  areas: { slug: string; name: string }[];
  className?: string;
};

const LISTING_OPTIONS: { value: "all" | ListingType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sale", label: "Buy" },
  { value: "rent", label: "Rent" },
  { value: "short_stay", label: "Short stays" },
];

const BED_OPTIONS = ["any", "1", "2", "3", "4", "5"];
const BATH_OPTIONS = ["any", "1", "2", "3", "4"];

/** All filter inputs. Controlled: the sidebar applies changes live, the mobile sheet edits a draft. */
export function FilterControls({ value, onChange, fixed, areas, className }: FilterControlsProps) {
  const listing = fixed.listing ?? value.listing;
  const isShortStay = listing === "short_stay";

  return (
    <div className={cn("flex flex-col divide-y divide-hairline", className)}>
      <KeywordField value={value.q ?? ""} onCommit={(q) => onChange({ q: q || null })} />

      {fixed.listing ? null : (
        <Section title="Looking to">
          <ToggleGroup
            type="single"
            value={value.listing ?? "all"}
            onValueChange={(v) => {
              if (!v) return;
              // Price ranges differ per type, so reset them when the type changes.
              onChange({ listing: v === "all" ? null : (v as ListingType), minPrice: null, maxPrice: null });
            }}
            aria-label="Listing type"
          >
            {LISTING_OPTIONS.map((o) => (
              <Chip key={o.value} value={o.value}>
                {o.label}
              </Chip>
            ))}
          </ToggleGroup>
        </Section>
      )}

      {isShortStay ? (
        <Section title="Dates & guests">
          <DateRangePicker
            value={{ checkIn: value.checkIn, checkOut: value.checkOut }}
            onChange={(d) => onChange(d)}
          />
          <ToggleGroup
            type="single"
            value={value.guests ? String(value.guests) : "any"}
            onValueChange={(v) => v && onChange({ guests: v === "any" ? null : Number(v) })}
            aria-label="Guests"
            className="mt-3"
          >
            {["any", "1", "2", "3", "4", "6", "8"].map((g) => (
              <Chip key={g} value={g}>
                {g === "any" ? "Any guests" : `${g}+`}
              </Chip>
            ))}
          </ToggleGroup>
        </Section>
      ) : null}

      {fixed.area ? null : (
        <Section title="Area">
          <ToggleGroup
            type="multiple"
            value={value.area}
            onValueChange={(area) => onChange({ area })}
            aria-label="Areas"
          >
            {areas.map((a) => (
              <Chip key={a.slug} value={a.slug}>
                {a.name}
              </Chip>
            ))}
          </ToggleGroup>
        </Section>
      )}

      <Section title="Price">
        {listing ? (
          <PriceRange
            key={listing}
            listing={listing}
            min={value.minPrice}
            max={value.maxPrice}
            onCommit={(range) => onChange(range)}
          />
        ) : (
          <p className="text-muted text-sm">Choose Buy, Rent or Short stays to filter by price.</p>
        )}
      </Section>

      <Section title="Property type">
        <ToggleGroup
          type="multiple"
          value={value.type}
          onValueChange={(type) => onChange({ type: type as PropertyType[] })}
          aria-label="Property type"
        >
          {propertyTypeOptions.map((o) => (
            <Chip key={o.value} value={o.value}>
              {o.label}
            </Chip>
          ))}
        </ToggleGroup>
      </Section>

      <Section title="Bedrooms">
        <ToggleGroup
          type="single"
          value={value.beds ? String(value.beds) : "any"}
          onValueChange={(v) => v && onChange({ beds: v === "any" ? null : Number(v) })}
          aria-label="Minimum bedrooms"
        >
          {BED_OPTIONS.map((b) => (
            <Chip key={b} value={b} className="min-w-11">
              {b === "any" ? "Any" : b === "5" ? "5+" : `${b}+`}
            </Chip>
          ))}
        </ToggleGroup>
      </Section>

      <Section title="Bathrooms">
        <ToggleGroup
          type="single"
          value={value.baths ? String(value.baths) : "any"}
          onValueChange={(v) => v && onChange({ baths: v === "any" ? null : Number(v) })}
          aria-label="Minimum bathrooms"
        >
          {BATH_OPTIONS.map((b) => (
            <Chip key={b} value={b} className="min-w-11">
              {b === "any" ? "Any" : `${b}+`}
            </Chip>
          ))}
        </ToggleGroup>
      </Section>

      <Section title="Furnishing">
        <ToggleGroup
          type="multiple"
          value={value.furnishing}
          onValueChange={(furnishing) => onChange({ furnishing: furnishing as Furnishing[] })}
          aria-label="Furnishing"
        >
          {FURNISHINGS.map((f) => (
            <Chip key={f} value={f}>
              {furnishingLabels[f]}
            </Chip>
          ))}
        </ToggleGroup>
      </Section>

      <Section title="Amenities">
        <ToggleGroup
          type="multiple"
          value={value.amenities}
          onValueChange={(amenities) => onChange({ amenities })}
          aria-label="Amenities"
        >
          {AMENITIES.map((a) => (
            <Chip key={a.value} value={a.value}>
              {a.label}
            </Chip>
          ))}
        </ToggleGroup>
      </Section>

      {isShortStay ? null : (
        <Section title="Available by">
          <DateField label="Move-in date" value={value.available} onChange={(available) => onChange({ available })} />
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3 py-5 first:pt-0">
      <legend className="float-left mb-3 w-full font-medium text-[0.7rem] text-muted uppercase tracking-[0.2em]">
        {title}
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

function KeywordField({ value, onCommit }: { value: string; onCommit: (q: string) => void }) {
  const id = useId();
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);
  // Follow external changes (e.g. "Clear all") without clobbering typing.
  if (value !== synced) {
    setSynced(value);
    setText(value);
  }

  useEffect(() => {
    if (text.trim() === value.trim()) return;
    const t = window.setTimeout(() => onCommit(text.trim()), 600);
    return () => window.clearTimeout(t);
  }, [text, value, onCommit]);

  return (
    <div className="pb-5">
      <label htmlFor={id} className="sr-only">
        Search by keyword
      </label>
      <div className="relative">
        <MagnifyingGlassIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted" />
        <Input
          id={id}
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCommit(text.trim());
            }
          }}
          placeholder="Keyword, road or estate…"
          className="pl-11"
          enterKeyHint="search"
        />
      </div>
    </div>
  );
}

function DateField({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: string | null;
  min?: string;
  onChange: (v: string | null) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-muted text-xs">
        {label}
      </label>
      <Input id={id} type="date" value={value ?? ""} min={min} onChange={(e) => onChange(e.target.value || null)} className="h-11" />
    </div>
  );
}
