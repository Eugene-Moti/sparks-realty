"use client";

import { ArrowLeftIcon, FloppyDiskIcon, TrashIcon } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormSection } from "@/components/admin/form-fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { PageHeader, useConfirm } from "@/components/admin/ui";
import { useAction } from "@/components/admin/use-action";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteArea, saveArea } from "@/lib/admin/actions/content";
import { slugify } from "@/lib/admin/schemas/property";

const LocationPicker = dynamic(() => import("@/components/admin/properties/location-picker"), {
  ssr: false,
  loading: () => <Skeleton className="h-80 w-full rounded-2xl" />,
});

type Area = {
  id: string;
  name: string;
  slug: string;
  county: string;
  summary: string | null;
  guide_md: string | null;
  hero_image: string | null;
  latitude: number | null;
  longitude: number | null;
};

const GUIDE_TEMPLATE = `## Why people love it
-

## Everyday life
Shops, schools, coffee, parks…

## Getting around
Main roads and typical drive times.

## Homes and prices
What's typical to buy and rent here.`;

export function AreaEditor({ area, canDelete }: { area: Area | null; canDelete: boolean }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { pending, run } = useAction();
  const [name, setName] = useState(area?.name ?? "");
  const [slug, setSlug] = useState(area?.slug ?? "");
  const [summary, setSummary] = useState(area?.summary ?? "");
  const [guide, setGuide] = useState(area?.guide_md ?? "");
  const [hero, setHero] = useState<string | null>(area?.hero_image ?? null);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    area?.latitude !== null && area?.latitude !== undefined && area.longitude !== null ? { lat: area.latitude, lng: area.longitude } : null,
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  async function save() {
    await run(
      () =>
        saveArea(area?.id ?? null, {
          name,
          slug: slug || null,
          county: area?.county ?? "Nairobi",
          summary,
          guide_md: guide,
          hero_image: hero,
          latitude: pin?.lat ?? null,
          longitude: pin?.lng ?? null,
        }),
      {
        success: "Area saved — the website is updated.",
        onSuccess: ({ id }) => {
          setErrors({});
          if (!area) router.replace(`/admin/areas/${id}`);
          else router.refresh();
        },
        onError: (r) => setErrors(Object.fromEntries(Object.entries(r.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))),
      },
    );
  }

  async function remove() {
    if (!area) return;
    const yes = await confirm({
      title: `Delete ${area.name}?`,
      description: "Listings in this area keep working but lose their area until you choose a new one. This can't be undone.",
      confirmLabel: "Delete area",
      destructive: true,
    });
    if (yes) await run(() => deleteArea(area.id), { success: "Area deleted.", onSuccess: () => router.replace("/admin/areas") });
  }

  return (
    <>
      <Link href="/admin/areas" className="inline-flex w-fit items-center gap-1.5 text-muted text-sm hover:text-foreground">
        <ArrowLeftIcon /> All areas
      </Link>
      <PageHeader
        eyebrow="Area guide"
        title={name || "New area"}
        actions={
          <>
            {area && canDelete ? (
              <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/8" onClick={() => void remove()} disabled={pending}>
                <TrashIcon /> Delete
              </Button>
            ) : null}
            <Button variant="green-solid" size="sm" onClick={() => void save()} disabled={pending}>
              <FloppyDiskIcon /> {pending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      />

      <FormSection title="Basics" description="The name appears in search filters, cards and the homepage strip.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" required error={errors.name}>
            {(ids) => (
              <Input
                {...ids}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!area) setSlug(slugify(e.target.value));
                }}
                className="h-11 text-sm"
              />
            )}
          </Field>
          <Field label="Web address" hint={`/areas/${slug || "…"}`} error={errors.slug}>
            {(ids) => <Input {...ids} value={slug} onChange={(e) => setSlug(e.target.value)} className="h-11 font-mono text-sm" />}
          </Field>
        </div>
        <Field label="Summary" hint={`${summary.length}/400 · one or two sentences for cards and the top of the guide`} error={errors.summary}>
          {(ids) => <Textarea {...ids} rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} className="text-sm" />}
        </Field>
      </FormSection>

      <FormSection title="Hero photo" description="A wide street or skyline photo. Shown at the top of the guide and on area cards.">
        <ImageUpload value={hero} onChange={setHero} folder="areas" label="Photo" hint="Landscape, at least 1600px wide." />
      </FormSection>

      <FormSection title="Guide" description="Use headings (##) for sections. Write for someone moving here from abroad.">
        <MarkdownEditor
          label="Guide text"
          value={guide}
          onChange={setGuide}
          imageFolder="areas"
          error={errors.guide_md}
          placeholder={GUIDE_TEMPLATE}
          hint={!guide ? "Tip: start from the outline shown in the box. Paste a YouTube, TikTok or Instagram link on its own line to add a video." : "Paste a YouTube, TikTok or Instagram link on its own line to add a video (it loads only when visitors press play)."}
        />
        {!guide ? (
          <Button type="button" variant="ghost" size="sm" className="w-fit border border-border" onClick={() => setGuide(GUIDE_TEMPLATE)}>
            Use the outline
          </Button>
        ) : null}
      </FormSection>

      <FormSection title="Map centre" description="Optional. Centres the area map. Click the map to set it.">
        <p className="font-mono text-muted text-xs">{pin ? `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}` : "Not set"}</p>
        <LocationPicker lat={pin?.lat ?? null} lng={pin?.lng ?? null} onChange={(lat, lng) => setPin({ lat, lng })} />
      </FormSection>
    </>
  );
}
