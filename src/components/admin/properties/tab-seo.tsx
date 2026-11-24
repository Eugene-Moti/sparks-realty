"use client";

import { LinkIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FormSection, TextAreaField, TextField } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { siteConfig, siteUrl } from "@/config/site";
import type { AdminMedia } from "@/lib/admin/actions/properties";
import { listingSlug } from "@/lib/admin/schemas/property";
import { formatPrice } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import type { EditorValues } from "./editor-types";
import type { EditorListing } from "./property-editor";

const routeFor = (t: EditorValues["listing_type"]) => (t === "short_stay" ? "/short-stays" : "/properties");

export function SeoTab({ listing, cover }: { listing: EditorListing | null; cover: AdminMedia | null }) {
  const { control, setValue } = useFormContext<EditorValues>();
  const [title, seoTitle, seoDescription, summary, slugInput, listingType, price, onRequest] = useWatch({
    control,
    name: ["title", "seo_title", "seo_description", "summary", "slug", "listing_type", "price_kes", "price_on_request"],
  });
  const [editingSlug, setEditingSlug] = useState(false);

  const isDraft = !listing || listing.status === "draft" || listing.slug.startsWith("draft-");
  const autoSlug = listingSlug(title || "listing", listing?.refCode ?? null);
  const slug = slugInput || (isDraft ? autoSlug : listing?.slug ?? autoSlug);
  const host = new URL(siteUrl).host;
  const path = `${routeFor(listingType)}/${slug}`;
  const shownTitle = (seoTitle || title || "Listing title").slice(0, 70);
  const priceText = formatPrice({
    priceKes: price ? Number(price.replace(/[,\s]/g, "")) : null,
    period: listingType === "sale" ? "once" : listingType === "rent" ? "month" : "night",
    priceOnRequest: onRequest,
  }).primary;
  const shownDescription = seoDescription || summary || `${priceText} · ${siteConfig.name}`;
  const coverSrc = cover ? mediaUrl(cover) : null;

  return (
    <div className="flex flex-col gap-6">
      <FormSection title="Web address" description="The link people share. Changing a live listing's address breaks old links, so only do it if you must.">
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-2 break-all font-mono text-sm">
            <LinkIcon className="shrink-0 text-accent" />
            <span className="text-muted">{host}</span>
            {path}
          </p>
          <p className="text-muted text-xs">
            {isDraft ? "Drafts follow the title automatically (title + reference code)." : "Locked to keep shared links working."}
          </p>
        </div>
        {editingSlug ? (
          <div className="flex flex-col gap-3">
            <TextField<EditorValues> name="slug" label="Custom address" placeholder={slug} hint="Lowercase letters, numbers and hyphens." />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setValue("slug", "", { shouldDirty: true });
                  setEditingSlug(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit border border-border"
            onClick={() => {
              setValue("slug", slug, { shouldDirty: true });
              setEditingSlug(true);
            }}
          >
            Change address
          </Button>
        )}
      </FormSection>

      <FormSection title="Search & sharing text" description="Optional. Leave blank to use the title and summary.">
        <TextField<EditorValues> name="seo_title" label="Search title" placeholder={title} hint={`${(seoTitle || "").length}/70 · shown as the blue link on Google`} />
        <TextAreaField<EditorValues> name="seo_description" label="Search description" rows={3} maxLength={170} placeholder={summary || undefined} />
      </FormSection>

      <section className="grid gap-6 lg:grid-cols-2" aria-label="Previews">
        <div className="flex flex-col gap-3 rounded-(--radius-card) border border-hairline bg-surface p-5 shadow-soft">
          <p className="eyebrow text-muted">Google preview</p>
          <div className="flex flex-col gap-1 rounded-2xl bg-white p-4 font-[arial,sans-serif] text-[#202124]">
            <p className="truncate text-[#4d5156] text-xs">
              {host} › {routeFor(listingType).slice(1)} › …
            </p>
            <p className="line-clamp-1 text-[#1a0dab] text-lg leading-snug">{`${shownTitle} · ${siteConfig.name}`}</p>
            <p className="line-clamp-2 text-[#4d5156] text-sm leading-snug">{shownDescription}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-(--radius-card) border border-hairline bg-surface p-5 shadow-soft">
          <p className="eyebrow flex items-center gap-2 text-muted">
            <WhatsappLogoIcon className="text-green-600" weight="fill" /> WhatsApp preview
          </p>
          <div className="rounded-2xl bg-[#e7ffdb] p-2 text-[#111b21]">
            <div className="overflow-hidden rounded-xl bg-[#d1f4cc]">
              <div className="relative aspect-[1.91/1] bg-[#c4e8bf]">
                {coverSrc ? <Image src={coverSrc} alt="" fill sizes="400px" className="object-cover" /> : null}
                {!coverSrc ? <p className="absolute inset-0 grid place-items-center text-[#54656f] text-xs">Add a cover photo</p> : null}
              </div>
              <div className="flex flex-col gap-0.5 p-2.5">
                <p className="line-clamp-2 font-semibold text-sm">{shownTitle}</p>
                <p className="line-clamp-2 text-[#54656f] text-xs">{shownDescription}</p>
                <p className="text-[#54656f] text-[0.7rem]">{host}</p>
              </div>
            </div>
            <p className="px-1.5 pt-1.5 text-sm">
              {`${siteUrl}${path}`.replace(/^https?:\/\//, "")}
            </p>
          </div>
          <p className="text-muted text-xs">The live share image also shows the price, beds and logo, generated automatically.</p>
        </div>
      </section>
    </div>
  );
}

