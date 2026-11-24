"use client";

import { FilmStripIcon, FloppyDiskIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FormSection, TextAreaField, TextField } from "@/components/admin/form-fields";
import { PageHeader } from "@/components/admin/ui";
import { useAction } from "@/components/admin/use-action";
import { CountUp } from "@/components/motion/count-up";
import { Button } from "@/components/ui/button";
import { saveSettings } from "@/lib/admin/actions/team";
import { storagePath, uploadFile } from "@/lib/admin/upload";
import { formatPhoneDisplay } from "@/lib/format";

export type SettingsValues = {
  company_name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  office_hours: string;
  youtube: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  hero_headline: string;
  hero_subline: string;
  hero_video_url: string;
  stats: { homes_sold: string; happy_clients: string; years: string; areas: string };
  usd_rate: string;
};

const STAT_LABELS: { key: keyof SettingsValues["stats"]; label: string; suffix: string }[] = [
  { key: "homes_sold", label: "Homes sold & let", suffix: "+" },
  { key: "happy_clients", label: "Happy clients", suffix: "+" },
  { key: "years", label: "Years in Nairobi", suffix: "" },
  { key: "areas", label: "Areas covered", suffix: "" },
];

const MAX_VIDEO_MB = 50;

export function SettingsForm({ initial, updatedAt }: { initial: SettingsValues; updatedAt: string | null }) {
  const router = useRouter();
  const { pending, run } = useAction();
  const form = useForm<SettingsValues>({ defaultValues: initial });
  const { isDirty } = form.formState;

  async function onSubmit(values: SettingsValues) {
    form.clearErrors();
    await run(() => saveSettings(values), {
      success: "Settings saved — the website is updated.",
      onSuccess: () => {
        form.reset(values);
        router.refresh();
      },
      onError: (r) => {
        for (const [k, v] of Object.entries(r.fieldErrors ?? {})) if (v?.[0]) form.setError(k as keyof SettingsValues, { message: v[0] });
      },
    });
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Company"
          title="Settings"
          description={`Contact details, social links, the homepage hero, stats and the USD rate.${
            updatedAt ? ` Last saved ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(new Date(updatedAt))}.` : ""
          }`}
          actions={
            <Button type="submit" variant="green-solid" disabled={pending || !isDirty}>
              <FloppyDiskIcon /> {pending ? "Saving…" : isDirty ? "Save changes" : "Saved"}
            </Button>
          }
        />

        <FormSection title="Contact" description="Used in the header, footer, every WhatsApp and Call button, and structured data for Google.">
          <TextField<SettingsValues> name="company_name" label="Company name" required />
          <div className="grid gap-5 sm:grid-cols-2">
            <PhoneField name="phone" label="Phone (calls)" hint="International format, e.g. +254792573443" />
            <PhoneField name="whatsapp" label="WhatsApp number" hint="Digits with country code, e.g. 254792573443" />
            <TextField<SettingsValues> name="email" label="Email" type="email" required />
            <TextField<SettingsValues> name="office_hours" label="Office hours" placeholder="Mon–Fri 8:00–18:00 · Sat 9:00–15:00" />
          </div>
          <TextField<SettingsValues> name="address" label="Office address" required />
        </FormSection>

        <FormSection title="Social links" description="Full https:// links. Leave blank to hide an icon.">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField<SettingsValues> name="youtube" label="YouTube" placeholder="https://www.youtube.com/@…" />
            <TextField<SettingsValues> name="tiktok" label="TikTok" placeholder="https://www.tiktok.com/@…" />
            <TextField<SettingsValues> name="instagram" label="Instagram" placeholder="https://www.instagram.com/…" />
            <TextField<SettingsValues> name="facebook" label="Facebook" placeholder="https://www.facebook.com/…" />
          </div>
        </FormSection>

        <FormSection title="Homepage hero" description="The first thing visitors see. Keep the headline short — it's revealed word by word.">
          <TextField<SettingsValues> name="hero_headline" label="Headline" required />
          <TextAreaField<SettingsValues> name="hero_subline" label="Subline" rows={2} maxLength={200} />
          <HeroVideo />
        </FormSection>

        <section id="stats" className="scroll-mt-24">
          <FormSection title="Homepage stats" description="The counters on the homepage. Use honest, checkable numbers; zero hides a counter.">
            <Stats />
          </FormSection>
        </section>

        <FormSection title="Currency" description="KES per 1 US dollar, for the USD prices shown to overseas visitors. Update it every week or two.">
          <TextField<SettingsValues> name="usd_rate" label="KES per USD" inputMode="decimal" placeholder="129.50" className="max-w-xs" />
        </FormSection>
      </form>
    </FormProvider>
  );
}

function PhoneField({ name, label, hint }: { name: "phone" | "whatsapp"; label: string; hint: string }) {
  const value = useWatch<SettingsValues, typeof name>({ name });
  return <TextField<SettingsValues> name={name} label={label} type="tel" required hint={value ? `Shown as ${formatPhoneDisplay(value)}` : hint} />;
}

function Stats() {
  const stats = useWatch<SettingsValues, "stats">({ name: "stats" });
  return (
    <>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {STAT_LABELS.map((s) => (
          <TextField<SettingsValues> key={s.key} name={`stats.${s.key}`} label={s.label} inputMode="numeric" />
        ))}
      </div>
      <div className="dark grid grid-cols-2 gap-4 rounded-2xl bg-ink p-6 text-ivory sm:grid-cols-4" aria-label="Preview">
        {STAT_LABELS.map((s) => {
          const n = Number(stats?.[s.key]) || 0;
          return (
            <div key={s.key} className="flex flex-col gap-1">
              <span className="font-display text-4xl text-gold">{n > 0 ? <CountUp key={n} value={n} suffix={s.suffix} /> : "—"}</span>
              <span className="text-ivory/60 text-xs">{s.label}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

function HeroVideo() {
  const value = useWatch<SettingsValues, "hero_video_url">({ name: "hero_video_url" });
  const { setValue } = useFormContext<SettingsValues>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  async function onFile(file: File) {
    if (!/^video\/(mp4|webm)$/.test(file.type)) return toast.error("Use an MP4 or WebM video.");
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) return toast.error(`Keep the video under ${MAX_VIDEO_MB} MB (15–30 seconds, 1080p, no sound is ideal).`);
    try {
      setProgress(0);
      const { publicUrl } = await uploadFile("site-media", storagePath("hero", file), file, setProgress);
      setValue("hero_video_url", publicUrl, { shouldDirty: true });
      toast.success("Video uploaded — save to put it live.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="font-medium text-sm">Background video (optional)</span>
      {value ? (
        <video src={value} muted loop playsInline autoPlay className="aspect-video w-full max-w-xl rounded-2xl bg-ink object-cover" />
      ) : (
        <p className="flex items-center gap-2 text-muted text-sm">
          <FilmStripIcon className="size-5" /> No video — the hero uses a slow photo crossfade.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="ghost" className="border border-border" disabled={progress !== null} onClick={() => inputRef.current?.click()}>
          <UploadSimpleIcon /> {progress !== null ? `Uploading ${Math.round(progress * 100)}%` : value ? "Replace video" : "Upload video"}
        </Button>
        {value ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => setValue("hero_video_url", "", { shouldDirty: true })}>
            <TrashIcon /> Remove
          </Button>
        ) : null}
      </div>
      <p className="text-muted text-xs">MP4 or WebM, under {MAX_VIDEO_MB} MB. Short, slow and silent works best; it never plays for visitors who prefer reduced motion.</p>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
