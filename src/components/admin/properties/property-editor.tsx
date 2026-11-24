"use client";

import {
  ArrowLeftIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  CopyIcon,
  DotsThreeIcon,
  EyeIcon,
  FloppyDiskIcon,
  RocketLaunchIcon,
  TrashIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DropdownMenu, Tabs } from "radix-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Pill, useConfirm } from "@/components/admin/ui";
import { useAction } from "@/components/admin/use-action";
import { Button } from "@/components/ui/button";
import { cn } from "@/helpers/classname-helper";
import {
  type AdminBlock,
  type AdminMedia,
  deleteProperty,
  duplicateProperty,
  saveProperty,
} from "@/lib/admin/actions/properties";
import { listingStatusLabels, listingStatusTones } from "@/lib/admin/labels";
import type { Option } from "@/lib/admin/queries";
import { propertySchema, publishProblems } from "@/lib/admin/schemas/property";
import type { ListingStatus, PropertyRow } from "@/types/db";
import { type EditorTab, type EditorValues, FIELD_TABS, toEditorValues } from "./editor-types";
import { BasicsTab } from "./tab-basics";
import { DetailsTab } from "./tab-details";
import { MediaTab } from "./tab-media";
import { PricingTab } from "./tab-pricing";
import { SeoTab } from "./tab-seo";
import { StayTab } from "./tab-stay";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const AUTOSAVE_MS = 2500;

export type EditorListing = { id: string; slug: string; refCode: string | null; status: ListingStatus };

export function PropertyEditor({
  listing,
  media: initialMedia,
  blocks,
  areas,
  agents,
  defaultAgentId,
  canDelete,
}: {
  listing: PropertyRow | null;
  media: AdminMedia[];
  blocks: AdminBlock[];
  areas: Option[];
  agents: Option[];
  defaultAgentId: string | null;
  canDelete: boolean;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const { run } = useAction();
  const form = useForm<EditorValues>({ defaultValues: toEditorValues(listing, defaultAgentId) });
  const [saved, setSaved] = useState<EditorListing | null>(
    listing ? { id: listing.id, slug: listing.slug, refCode: listing.ref_code, status: listing.status } : null,
  );
  const [media, setMedia] = useState<AdminMedia[]>(initialMedia);
  const [tab, setTab] = useState<EditorTab>("basics");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(listing?.updated_at ?? null);
  const saving = useRef(false);

  const listingType = useWatch({ control: form.control, name: "listing_type" });
  const titleValue = useWatch({ control: form.control, name: "title" });
  const { isDirty, errors } = form.formState;
  const isDraft = (saved?.status ?? "draft") === "draft";

  /** Validate on the client, save on the server, map errors back to fields and tabs. */
  const save = useCallback(
    async (opts: { status?: ListingStatus; quiet?: boolean } = {}) => {
      if (saving.current) return false;
      const values = { ...form.getValues(), ...(opts.status ? { status: opts.status } : {}) };
      const parsed = propertySchema.safeParse(values);
      form.clearErrors();
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const key = issue.path[0] as keyof EditorValues;
          form.setError(key, { message: issue.message });
        }
        const first = parsed.error.issues[0]?.path[0] as keyof EditorValues | undefined;
        if (!opts.quiet) {
          setTab((first && FIELD_TABS[first]) || "basics");
          toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
        }
        setSaveState("error");
        return false;
      }

      saving.current = true;
      setSaveState("saving");
      const result = await saveProperty(saved?.id ?? null, values).catch(() => ({ ok: false as const, error: "Couldn't reach the server." }));
      saving.current = false;

      if (!result.ok) {
        setSaveState("error");
        if ("fieldErrors" in result && result.fieldErrors) {
          for (const [k, m] of Object.entries(result.fieldErrors)) if (m?.[0]) form.setError(k as keyof EditorValues, { message: m[0] });
        }
        toast.error(result.error);
        return false;
      }

      const next = result.data;
      // Keep what was typed while saving; mark the saved snapshot as clean.
      form.reset({ ...form.getValues(), status: next.status as ListingStatus, slug: "" }, { keepValues: false });
      setSaved({ id: next.id, slug: next.slug, refCode: next.refCode, status: next.status as ListingStatus });
      setSavedAt(next.updatedAt);
      setSaveState("saved");
      if (!saved) {
        toast.success(`Draft created${next.refCode ? ` (${next.refCode})` : ""}. You can add photos now.`);
        // Explicit first save only (no autosave before this), so nobody is mid-typing
        // when the editor reopens on the listing's own page.
        router.replace(`/admin/properties/${next.id}`);
      } else if (!opts.quiet) {
        toast.success(opts.status === "published" && saved.status !== "published" ? "Published — it's live on the website." : "Saved.");
      }
      return true;
    },
    [form, saved, router],
  );

  // Autosave drafts once they exist (never live listings — those wait for "Save").
  // A brand-new listing is created by an explicit "Save draft".
  const watched = useWatch({ control: form.control });
  const exists = saved !== null;
  useEffect(() => {
    if (!exists || !isDirty || !isDraft) return;
    const title = form.getValues("title").trim();
    if (title.length < 6) return;
    const t = setTimeout(() => void save({ quiet: true }), AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [watched, exists, isDirty, isDraft, form, save]);

  // ⌘/Ctrl+S saves; warn before leaving with unsaved changes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [save, form]);

  async function publish() {
    const parsed = propertySchema.safeParse({ ...form.getValues(), status: "published" });
    if (!parsed.success) return save({ status: "published" });
    const problems = publishProblems(parsed.data, media.length);
    if (problems.length) {
      toast.error(`Almost there. ${problems.join(" ")}`, { duration: 8000 });
      if (problems.some((p) => p.includes("Media"))) setTab("media");
      return;
    }
    const yes = await confirm({
      title: "Publish this listing?",
      description: "It will appear on the website, in search and on the map straight away. You can unpublish any time.",
      confirmLabel: "Publish",
    });
    if (yes) await save({ status: "published" });
  }

  async function remove() {
    if (!saved) return;
    const yes = await confirm({
      title: "Delete this listing permanently?",
      description: "Its photos, enquiries' link to it and blocked dates are removed. This can't be undone — archive it instead if you might need it again.",
      confirmLabel: "Delete forever",
      destructive: true,
    });
    if (!yes) return;
    await run(() => deleteProperty(saved.id), {
      success: "Listing deleted.",
      onSuccess: () => {
        form.reset(form.getValues());
        router.replace("/admin/properties");
      },
    });
  }

  const tabErrors = (t: EditorTab) =>
    Object.keys(errors).filter((k) => (FIELD_TABS[k as keyof EditorValues] ?? "basics") === t).length;

  const tabs: { value: EditorTab; label: string; hidden?: boolean }[] = [
    { value: "basics", label: "Basics" },
    { value: "pricing", label: "Pricing" },
    { value: "details", label: "Details" },
    { value: "media", label: `Media${media.length ? ` · ${media.length}` : ""}` },
    { value: "stay", label: "Short stay", hidden: listingType !== "short_stay" },
    { value: "seo", label: "SEO & sharing" },
  ];
  const activeTab = tab === "stay" && listingType !== "short_stay" ? "basics" : tab;

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-6">
        <Link href="/admin/properties" className="inline-flex w-fit items-center gap-1.5 text-muted text-sm hover:text-foreground">
          <ArrowLeftIcon /> All listings
        </Link>

        <header className="sticky top-14 z-20 -mx-4 flex flex-col gap-3 border-hairline border-b bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-10 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={listingStatusTones[saved?.status ?? "draft"]}>{listingStatusLabels[saved?.status ?? "draft"]}</Pill>
              {saved?.refCode ? <span className="font-mono text-muted text-xs tracking-widest">{saved.refCode}</span> : null}
              <SaveIndicator state={saveState === "saving" || saveState === "error" ? saveState : isDirty ? "dirty" : saveState} savedAt={savedAt} isDraft={isDraft} autosaves={exists} />
            </div>
            <h1 className="truncate font-display text-2xl leading-tight sm:text-3xl">{titleValue || "New listing"}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {saved ? (
              <Button asChild variant="ghost" size="sm" className="border border-border">
                <a href={`/preview/${saved.id}`} target="_blank" rel="noopener">
                  <EyeIcon /> Preview
                </a>
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" className="border border-border" onClick={() => void save()} disabled={saveState === "saving"}>
              <FloppyDiskIcon /> {isDraft ? "Save draft" : "Save changes"}
            </Button>
            {isDraft ? (
              <Button variant="green-solid" size="sm" onClick={() => void publish()} disabled={saveState === "saving" || !saved}>
                <RocketLaunchIcon /> Publish
              </Button>
            ) : null}
            {saved ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button type="button" className="grid size-9 place-items-center rounded-full border border-border hover:bg-foreground/6" aria-label="More actions">
                    <DotsThreeIcon weight="bold" className="size-5" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content align="end" sideOffset={6} className="z-50 min-w-52 rounded-2xl border border-hairline bg-surface p-1.5 text-sm shadow-lift">
                    <DropdownMenu.Item
                      className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 outline-none data-highlighted:bg-foreground/6"
                      onSelect={() =>
                        run(() => duplicateProperty(saved.id), {
                          success: "Copied as a new draft.",
                          onSuccess: ({ id }) => router.push(`/admin/properties/${id}`),
                        })
                      }
                    >
                      <CopyIcon /> Duplicate listing
                    </DropdownMenu.Item>
                    {!isDraft ? (
                      <DropdownMenu.Item
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 outline-none data-highlighted:bg-foreground/6"
                        onSelect={() => void save({ status: "draft" })}
                      >
                        <ArrowLeftIcon /> Unpublish (back to draft)
                      </DropdownMenu.Item>
                    ) : null}
                    {canDelete ? (
                      <DropdownMenu.Item
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-danger outline-none data-highlighted:bg-danger/8"
                        onSelect={() => void remove()}
                      >
                        <TrashIcon /> Delete permanently
                      </DropdownMenu.Item>
                    ) : null}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : null}
          </div>
        </header>

        <Tabs.Root value={activeTab} onValueChange={(v) => setTab(v as EditorTab)} className="flex flex-col gap-6">
          <Tabs.List aria-label="Listing sections" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 scrollbar-none">
            {tabs
              .filter((t) => !t.hidden)
              .map((t) => {
                const n = tabErrors(t.value);
                return (
                  <Tabs.Trigger
                    key={t.value}
                    value={t.value}
                    className={cn(
                      "relative flex h-10 shrink-0 items-center gap-2 rounded-full px-4 font-medium text-sm transition-colors",
                      "text-muted hover:text-foreground data-[state=active]:bg-ink data-[state=active]:text-ivory",
                      "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
                    )}
                  >
                    {t.label}
                    {n ? (
                      <span className="grid size-5 place-items-center rounded-full bg-danger font-mono text-[0.65rem] text-ivory" aria-label={`${n} problem${n === 1 ? "" : "s"}`}>
                        {n}
                      </span>
                    ) : null}
                  </Tabs.Trigger>
                );
              })}
          </Tabs.List>

          <Tabs.Content value="basics" className="focus-visible:outline-none">
            <BasicsTab areas={areas} isNew={!saved} />
          </Tabs.Content>
          <Tabs.Content value="pricing" className="focus-visible:outline-none">
            <PricingTab />
          </Tabs.Content>
          <Tabs.Content value="details" className="focus-visible:outline-none">
            <DetailsTab agents={agents} />
          </Tabs.Content>
          <Tabs.Content value="media" className="focus-visible:outline-none" forceMount hidden={activeTab !== "media"}>
            <MediaTab listing={saved} media={media} setMedia={setMedia} />
          </Tabs.Content>
          {listingType === "short_stay" ? (
            <Tabs.Content value="stay" className="focus-visible:outline-none">
              <StayTab listingId={saved?.id ?? null} blocks={blocks} />
            </Tabs.Content>
          ) : null}
          <Tabs.Content value="seo" className="focus-visible:outline-none">
            <SeoTab listing={saved} cover={media.find((m) => m.is_cover) ?? media[0] ?? null} />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </FormProvider>
  );
}

function SaveIndicator({ state, savedAt, isDraft, autosaves }: { state: SaveState; savedAt: string | null; isDraft: boolean; autosaves: boolean }) {
  const time = savedAt
    ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" }).format(new Date(savedAt))
    : null;
  const content =
    state === "saving" ? (
      <>
        <CircleNotchIcon className="animate-spin motion-reduce:animate-none" /> Saving…
      </>
    ) : state === "dirty" ? (
      <>
        <span className="size-1.5 rounded-full bg-gold-600" /> {!autosaves ? "Not saved yet" : isDraft ? "Unsaved — autosaving" : "Unsaved changes"}
      </>
    ) : state === "error" ? (
      <>
        <WarningCircleIcon className="text-danger" /> Not saved
      </>
    ) : time ? (
      <>
        <CheckCircleIcon className="text-green-600" /> Saved {time}
      </>
    ) : null;
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-1.5 text-muted text-xs [&_svg]:size-3.5">
      {content}
    </span>
  );
}
