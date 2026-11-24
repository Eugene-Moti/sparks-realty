"use client";

import { PencilSimpleIcon, PlusIcon, StarIcon, TrashIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { ImageUpload } from "@/components/admin/image-upload";
import { SortableList } from "@/components/admin/sortable-list";
import { EmptyState, PageHeader, Pill, Switch, useConfirm } from "@/components/admin/ui";
import { useAction } from "@/components/admin/use-action";
import { ClickToLoadEmbed } from "@/components/privacy/click-to-load-embed";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { deleteVideo, reorderRows, saveVideo } from "@/lib/admin/actions/content";
import type { AdminVideo } from "@/lib/admin/labels";
import type { Option } from "@/lib/admin/queries";
import { parseVideoUrl, platformLabel, youTubeThumbnail } from "@/lib/embeds";

function thumbFor(v: Pick<AdminVideo, "url" | "thumbnail">): string | null {
  if (v.thumbnail) return v.thumbnail;
  const p = parseVideoUrl(v.url);
  return p?.platform === "youtube" ? youTubeThumbnail(p.id) : null;
}

export function VideoManager({ items: initial, listings }: { items: AdminVideo[]; listings: Option[] }) {
  const confirm = useConfirm();
  const { run } = useAction();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<AdminVideo | "new" | null>(null);
  const upsert = (v: AdminVideo) => setItems((l) => (l.some((x) => x.id === v.id) ? l.map((x) => (x.id === v.id ? v : x)) : [v, ...l]));

  async function remove(v: AdminVideo) {
    const yes = await confirm({ title: "Remove this video?", description: "It's removed from House tours. The original stays on YouTube/TikTok.", confirmLabel: "Remove", destructive: true });
    if (yes) await run(() => deleteVideo(v.id), { success: "Removed.", onSuccess: () => setItems((l) => l.filter((x) => x.id !== v.id)) });
  }

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="House tours"
        description="Paste links from the Sparks Properties YouTube, TikTok, Instagram or Facebook. Visitors' browsers only contact those sites after pressing play."
        actions={
          <Button variant="green-solid" onClick={() => setEditing("new")}>
            <PlusIcon weight="bold" /> Add video
          </Button>
        }
      />
      {items.length ? (
        <SortableList
          label="Videos"
          items={items}
          setItems={setItems}
          onReorder={(ids) => reorderRows("videos", ids)}
          renderItem={(v) => {
            const thumb = thumbFor(v);
            return (
              <div className="flex items-center gap-4">
                <span className="relative hidden h-14 w-24 shrink-0 overflow-hidden rounded-xl bg-ink sm:block">
                  {thumb ? <Image src={thumb} alt="" fill sizes="96px" className="object-cover" /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{v.title || "Untitled video"}</p>
                  <p className="flex flex-wrap items-center gap-2 text-muted text-xs">
                    <Pill>{platformLabel[v.platform as keyof typeof platformLabel] ?? v.platform}</Pill>
                    {v.is_featured ? (
                      <Pill tone="gold">
                        <StarIcon weight="fill" /> Featured
                      </Pill>
                    ) : null}
                    {v.property_id ? <span className="truncate">{listings.find((l) => l.value === v.property_id)?.label}</span> : null}
                  </p>
                </div>
                <button type="button" onClick={() => setEditing(v)} className="grid size-9 place-items-center rounded-full text-muted hover:bg-foreground/6 hover:text-foreground" aria-label="Edit video">
                  <PencilSimpleIcon />
                </button>
                <button type="button" onClick={() => void remove(v)} className="grid size-9 place-items-center rounded-full text-muted hover:bg-danger/10 hover:text-danger" aria-label="Remove video">
                  <TrashIcon />
                </button>
              </div>
            );
          }}
        />
      ) : (
        <EmptyState title="No videos yet" action={<Button variant="green-solid" onClick={() => setEditing("new")}>Add a video</Button>}>
          Video tours are the fastest way to win diaspora buyers.
        </EmptyState>
      )}
      {editing ? (
        <VideoDialog
          key={editing === "new" ? "new" : editing.id}
          item={editing === "new" ? null : editing}
          listings={listings}
          onClose={() => setEditing(null)}
          onSaved={(v) => {
            upsert(v);
            setEditing(null);
          }}
        />
      ) : null}
    </>
  );
}

function VideoDialog({
  item,
  listings,
  onClose,
  onSaved,
}: {
  item: AdminVideo | null;
  listings: Option[];
  onClose: () => void;
  onSaved: (v: AdminVideo) => void;
}) {
  const { pending, run } = useAction();
  const [url, setUrl] = useState(item?.url ?? "");
  const [title, setTitle] = useState(item?.title ?? "");
  const [thumbnail, setThumbnail] = useState<string | null>(item?.thumbnail ?? null);
  const [propertyId, setPropertyId] = useState(item?.property_id ?? "");
  const [featured, setFeatured] = useState(item?.is_featured ?? false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const parsed = url.trim() ? parseVideoUrl(url) : null;

  async function save() {
    await run(() => saveVideo(item?.id ?? null, { url, title, thumbnail, property_id: propertyId, is_featured: featured }), {
      success: "Video saved.",
      onSuccess: onSaved,
      onError: (r) => setErrors(Object.fromEntries(Object.entries(r.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))),
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? "Edit video" : "Add a video"}</DialogTitle>
          <DialogDescription>Paste the link from the app’s Share button.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <Field
            label="Video link"
            required
            error={errors.url ?? (url.trim() && !parsed ? "That isn't a YouTube, TikTok, Instagram or Facebook video link yet." : undefined)}
            hint={parsed ? `Detected: ${platformLabel[parsed.platform]}` : undefined}
          >
            {(ids) => <Input {...ids} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" className="h-11 text-sm" />}
          </Field>
          {parsed ? (
            <div className="flex justify-center">
              <ClickToLoadEmbed url={url} title={title || "Video preview"} thumbnail={thumbnail} className="w-full max-w-md" />
            </div>
          ) : null}
          <Field label="Title" error={errors.title}>
            {(ids) => <Input {...ids} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 4-bed maisonette walk-through, Kileleshwa" className="h-11 text-sm" />}
          </Field>
          <Field label="Listing" hint="Optional — shows the video on that listing too.">
            {(ids) => (
              <Select {...ids} value={propertyId} onChange={(e) => setPropertyId(e.target.value)} placeholder="Not linked" options={listings} className="[&_select]:h-11 [&_select]:text-sm" />
            )}
          </Field>
          <ImageUpload
            value={thumbnail}
            onChange={setThumbnail}
            folder="videos"
            label="Cover image (optional)"
            hint="YouTube covers are added automatically. Upload one for TikTok, Instagram and Facebook."
            aspect={parsed && parsed.platform !== "youtube" ? "aspect-[9/16] max-w-48" : "aspect-video"}
          />
          <Switch checked={featured} onCheckedChange={setFeatured} label="Featured" description="The big video at the top of House tours on the homepage." />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="green-solid" onClick={() => void save()} disabled={pending || !parsed}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
