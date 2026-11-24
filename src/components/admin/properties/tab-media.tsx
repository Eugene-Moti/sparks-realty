"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CheckCircleIcon,
  DotsSixVerticalIcon,
  FilePdfIcon,
  ImageSquareIcon,
  StarIcon,
  TrashIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import type React from "react";
import { type ChangeEvent, type DragEvent, useId, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FormSection, TextField } from "@/components/admin/form-fields";
import { useConfirm } from "@/components/admin/ui";
import { ClickToLoadEmbed } from "@/components/privacy/click-to-load-embed";
import { Button } from "@/components/ui/button";
import { cn } from "@/helpers/classname-helper";
import {
  type AdminMedia,
  addPropertyImage,
  deletePropertyImage,
  removeListingFile,
  reorderPropertyImages,
  setCoverImage,
  updatePropertyImage,
} from "@/lib/admin/actions/properties";
import { ROOM_LABELS } from "@/lib/admin/schemas/property";
import { prepareImage, storagePath, uploadFile } from "@/lib/admin/upload";
import { parseVideoUrl } from "@/lib/embeds";
import { mediaUrl, storagePublicUrl } from "@/lib/media";
import type { EditorValues } from "./editor-types";
import type { EditorListing } from "./property-editor";

type Upload = { key: string; name: string; progress: number; status: "preparing" | "uploading" | "saving" | "error"; error?: string };

const MAX_FILES = 40;
const CONCURRENCY = 3;

export function MediaTab({
  listing,
  media,
  setMedia,
}: {
  listing: EditorListing | null;
  media: AdminMedia[];
  setMedia: React.Dispatch<React.SetStateAction<AdminMedia[]>>;
}) {
  if (!listing) {
    return (
      <FormSection title="Photos" description="Upload photos once the listing has been saved.">
        <p className="rounded-2xl border border-border border-dashed p-6 text-muted text-sm">
          Add a title in Basics and press Save draft, then come back here to add photos.
        </p>
      </FormSection>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <PhotoManager listingId={listing.id} media={media} setMedia={setMedia} />
      <VideoLinks />
      <Documents listingId={listing.id} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

function PhotoManager({
  listingId,
  media,
  setMedia,
}: {
  listingId: string;
  media: AdminMedia[];
  setMedia: React.Dispatch<React.SetStateAction<AdminMedia[]>>;
}) {
  const inputId = useId();
  const confirm = useConfirm();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const patch = (key: string, p: Partial<Upload>) => setUploads((u) => u.map((x) => (x.key === key ? { ...x, ...p } : x)));

  async function uploadOne(file: File, key: string) {
    try {
      const prepared = await prepareImage(file);
      patch(key, { status: "uploading" });
      const path = storagePath(listingId, prepared.file);
      await uploadFile("property-media", path, prepared.file, (f) => patch(key, { progress: f }));
      patch(key, { status: "saving" });
      const result = await addPropertyImage(listingId, {
        storage_path: path,
        width: prepared.width,
        height: prepared.height,
        blur_data: prepared.blurData,
        alt: null,
        room_label: null,
      });
      if (!result.ok) throw new Error(result.error);
      setMedia((m) => [...m, result.data]);
      setUploads((u) => u.filter((x) => x.key !== key));
    } catch (err) {
      patch(key, { status: "error", error: err instanceof Error ? err.message : "Upload failed." });
    }
  }

  async function addFiles(list: FileList | File[]) {
    const files = [...list].filter((f) => f.type.startsWith("image/"));
    if (!files.length) {
      toast.error("Choose image files (JPG, PNG, WebP or HEIC converted to JPG).");
      return;
    }
    if (files.length > MAX_FILES) toast.warning(`Uploading the first ${MAX_FILES} photos.`);
    const batch = files.slice(0, MAX_FILES).map((file) => ({ file, key: crypto.randomUUID() }));
    setUploads((u) => [...u, ...batch.map(({ file, key }) => ({ key, name: file.name, progress: 0, status: "preparing" as const }))]);
    // A few at a time: fast, without flooding a phone connection.
    const queue = [...batch];
    await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        for (let next = queue.shift(); next; next = queue.shift()) await uploadOne(next.file, next.key);
      }),
    );
    if (batch.length) toast.success("Photos uploaded. Drag to reorder; the first photo isn't automatically the cover — use the star.");
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files);
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = media.findIndex((m) => m.id === active.id);
    const to = media.findIndex((m) => m.id === over.id);
    const next = arrayMove(media, from, to);
    setMedia(next);
    const result = await reorderPropertyImages(listingId, next.map((m) => m.id));
    if (!result.ok) {
      toast.error(result.error);
      setMedia(media);
    }
  }

  async function makeCover(id: string) {
    const before = media;
    setMedia((m) => m.map((x) => ({ ...x, is_cover: x.id === id })));
    const result = await setCoverImage(listingId, id);
    if (!result.ok) {
      toast.error(result.error);
      setMedia(before);
    } else toast.success("Cover photo updated.");
  }

  async function remove(item: AdminMedia) {
    const yes = await confirm({ title: "Delete this photo?", description: "It's removed from the listing and the website.", confirmLabel: "Delete", destructive: true });
    if (!yes) return;
    const before = media;
    setMedia((m) => {
      const rest = m.filter((x) => x.id !== item.id);
      return item.is_cover && rest[0] ? rest.map((x, i) => ({ ...x, is_cover: i === 0 })) : rest;
    });
    const result = await deletePropertyImage(item.id);
    if (!result.ok) {
      toast.error(result.error);
      setMedia(before);
    }
  }

  return (
    <FormSection
      title="Photos"
      description="Landscape photos look best. They're resized and converted to WebP before uploading, so large phone photos are fine."
    >
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver ? "border-green-600 bg-green-50" : "border-border hover:border-gold-600/50 hover:bg-gold-100/30",
        )}
      >
        <UploadSimpleIcon className="size-8 text-accent" />
        <span className="font-medium">Drop photos here, or click to choose</span>
        <span className="text-muted text-xs">Up to {MAX_FILES} at a time · JPG, PNG or WebP</span>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {uploads.length ? (
        <ul className="flex flex-col gap-2" aria-live="polite" aria-label="Uploads">
          {uploads.map((u) => (
            <li key={u.key} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2 text-sm">
              {u.status === "error" ? <WarningCircleIcon className="size-4 shrink-0 text-danger" /> : <ImageSquareIcon className="size-4 shrink-0 text-muted" />}
              <span className="min-w-0 flex-1 truncate">{u.name}</span>
              {u.status === "error" ? (
                <>
                  <span className="text-danger text-xs">{u.error}</span>
                  <button type="button" className="text-muted text-xs underline" onClick={() => setUploads((x) => x.filter((y) => y.key !== u.key))}>
                    Dismiss
                  </button>
                </>
              ) : (
                <>
                  <span className="w-20 text-right text-muted text-xs">
                    {u.status === "preparing" ? "Optimising…" : u.status === "saving" ? "Saving…" : `${Math.round(u.progress * 100)}%`}
                  </span>
                  <span className="h-1.5 w-24 overflow-hidden rounded-full bg-foreground/8" aria-hidden="true">
                    <span className="block h-full rounded-full bg-green-600 transition-[width]" style={{ width: `${Math.round(u.progress * 100)}%` }} />
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {media.length ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={media.map((m) => m.id)} strategy={rectSortingStrategy}>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {media.map((m, i) => (
                <SortablePhoto key={m.id} item={m} index={i} onCover={() => makeCover(m.id)} onDelete={() => remove(m)} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="text-muted text-sm">No photos yet. Listings need at least one photo to be published.</p>
      )}
      <datalist id="room-labels">
        {ROOM_LABELS.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
    </FormSection>
  );
}

function SortablePhoto({ item, index, onCover, onDelete }: { item: AdminMedia; index: number; onCover: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const src = mediaUrl(item);
  const [room, setRoom] = useState(item.room_label ?? "");
  const [alt, setAlt] = useState(item.alt ?? "");
  const [savedField, setSavedField] = useState<string | null>(null);
  const lastSaved = useRef({ room_label: item.room_label ?? "", alt: item.alt ?? "" });

  async function persist(field: "room_label" | "alt", value: string) {
    if (lastSaved.current[field] === value.trim()) return;
    const result = await updatePropertyImage(item.id, { [field]: value });
    if (!result.ok) toast.error(result.error);
    else {
      lastSaved.current[field] = value.trim();
      setSavedField(field);
      setTimeout(() => setSavedField(null), 1500);
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex flex-col overflow-hidden rounded-2xl border border-border bg-surface", isDragging && "z-10 shadow-lift ring-2 ring-gold-600")}
    >
      <div className="relative aspect-[3/2] bg-surface-2">
        {src ? (
          <Image
            src={src}
            alt={item.alt ?? ""}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 640px) 40vw, 90vw"
            className="object-cover"
            placeholder={item.blur_data ? "blur" : "empty"}
            blurDataURL={item.blur_data ?? undefined}
          />
        ) : null}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder photo ${index + 1}`}
          className="absolute top-2 left-2 grid size-9 cursor-grab place-items-center rounded-full bg-ink/70 text-ivory backdrop-blur active:cursor-grabbing"
        >
          <DotsSixVerticalIcon weight="bold" className="size-4" />
        </button>
        <span className="absolute bottom-2 left-2 rounded-full bg-ink/70 px-2 py-0.5 font-mono text-[0.7rem] text-ivory">{index + 1}</span>
        <div className="absolute top-2 right-2 flex gap-1.5">
          <button
            type="button"
            onClick={onCover}
            aria-pressed={item.is_cover}
            aria-label={item.is_cover ? "Cover photo" : "Make cover photo"}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-full px-3 text-xs backdrop-blur",
              item.is_cover ? "bg-gold text-ink" : "bg-ink/70 text-ivory hover:bg-ink/85",
            )}
          >
            <StarIcon weight={item.is_cover ? "fill" : "regular"} className="size-4" />
            {item.is_cover ? "Cover" : null}
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete photo"
            className="grid size-9 place-items-center rounded-full bg-ink/70 text-ivory backdrop-blur hover:bg-danger"
          >
            <TrashIcon className="size-4" />
          </button>
        </div>
      </div>
      <div className="grid gap-2 p-3">
        <label className="flex flex-col gap-1 text-xs">
          <span className="flex items-center justify-between text-muted">
            Room {savedField === "room_label" ? <CheckCircleIcon className="text-green-600" aria-label="Saved" /> : null}
          </span>
          <input
            list="room-labels"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            onBlur={() => void persist("room_label", room)}
            placeholder="e.g. Kitchen"
            className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="flex items-center justify-between text-muted">
            Description for screen readers {savedField === "alt" ? <CheckCircleIcon className="text-green-600" aria-label="Saved" /> : null}
          </span>
          <input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            onBlur={() => void persist("alt", alt)}
            placeholder="e.g. Open-plan kitchen with island"
            className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring"
          />
        </label>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Video links (saved with the form)
// ---------------------------------------------------------------------------

function VideoLinks() {
  const { control } = useFormContext<EditorValues>();
  const [yt, tt, ig, tour] = useWatch({ control, name: ["youtube_url", "tiktok_url", "instagram_url", "virtual_tour_url"] });
  const previews = [yt, tt, ig].filter((u) => u && parseVideoUrl(u));

  return (
    <FormSection title="Video tours" description="Paste a link. Visitors' browsers only contact YouTube, TikTok or Instagram after they press play.">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField<EditorValues> name="youtube_url" label="YouTube" placeholder="https://www.youtube.com/watch?v=…" hint={yt && !parseVideoUrl(yt) ? "That doesn't look like a YouTube video link." : undefined} />
        <TextField<EditorValues> name="tiktok_url" label="TikTok" placeholder="https://www.tiktok.com/@sparksproperties/video/…" hint={tt && !parseVideoUrl(tt) ? "That doesn't look like a TikTok video link." : undefined} />
        <TextField<EditorValues> name="instagram_url" label="Instagram" placeholder="https://www.instagram.com/reel/…" hint={ig && !parseVideoUrl(ig) ? "That doesn't look like an Instagram post or reel link." : undefined} />
        <TextField<EditorValues> name="virtual_tour_url" label="3D tour (Matterport, Kuula)" placeholder="https://my.matterport.com/show/?m=…" hint={tour ? "Shown as a click-to-start tour." : undefined} />
      </div>
      {previews.length ? (
        <div className="flex flex-col gap-2">
          <p className="font-medium text-sm">Preview</p>
          <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {previews.map((u) => (
              <ClickToLoadEmbed key={u} url={u as string} title="Listing video preview" className="max-w-none" />
            ))}
          </div>
        </div>
      ) : null}
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Floor plan & brochure (paths saved with the form)
// ---------------------------------------------------------------------------

function Documents({ listingId }: { listingId: string }) {
  return (
    <FormSection title="Floor plan & brochure" description="PDF or image, up to 15 MB. Shown as downloads on the listing.">
      <DocField listingId={listingId} name="floor_plan_url" label="Floor plan" accept="application/pdf,image/*" />
      <DocField listingId={listingId} name="brochure_url" label="Brochure" accept="application/pdf" />
    </FormSection>
  );
}

function DocField({ listingId, name, label, accept }: { listingId: string; name: "floor_plan_url" | "brochure_url"; label: string; accept: string }) {
  const { control, setValue } = useFormContext<EditorValues>();
  const value = useWatch({ control, name });
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  async function onFile(file: File) {
    if (file.size > 15 * 1024 * 1024) return toast.error(`${file.name} is larger than 15 MB.`);
    try {
      setProgress(0);
      const toUpload = file.type.startsWith("image/") ? (await prepareImage(file)).file : file;
      const path = storagePath(`${listingId}/docs`, toUpload);
      await uploadFile("property-media", path, toUpload, setProgress);
      setValue(name, path, { shouldDirty: true });
      toast.success(`${label} uploaded — remember to save.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setProgress(null);
    }
  }

  const href = value ? (value.startsWith("http") ? value : storagePublicUrl("property-media", value)) : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4">
      <div className="flex min-w-0 items-center gap-3">
        <FilePdfIcon className="size-6 shrink-0 text-accent" />
        <div className="min-w-0">
          <p className="font-medium text-sm">{label}</p>
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="block truncate text-accent text-xs underline-offset-4 hover:underline">
              {value.split("/").pop()}
            </a>
          ) : (
            <p className="text-muted text-xs">{progress !== null ? `Uploading… ${Math.round(progress * 100)}%` : "None uploaded"}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {value ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              if (value.includes("/docs/")) void removeListingFile(value);
              setValue(name, "", { shouldDirty: true });
            }}
          >
            Remove
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="ghost" className="border border-border" disabled={progress !== null} onClick={() => inputRef.current?.click()}>
          <UploadSimpleIcon /> {value ? "Replace" : "Upload"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
