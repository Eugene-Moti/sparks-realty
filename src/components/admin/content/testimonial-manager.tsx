"use client";

import { PencilSimpleIcon, PlusIcon, StarIcon, TrashIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { ImageUpload } from "@/components/admin/image-upload";
import { SortableList } from "@/components/admin/sortable-list";
import { EmptyState, PageHeader, Switch, useConfirm } from "@/components/admin/ui";
import { useAction } from "@/components/admin/use-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { cn } from "@/helpers/classname-helper";
import { deleteTestimonial, reorderRows, saveTestimonial } from "@/lib/admin/actions/content";
import type { AdminTestimonial } from "@/lib/admin/labels";

export function TestimonialManager({ items: initial }: { items: AdminTestimonial[] }) {
  const confirm = useConfirm();
  const { run } = useAction();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<AdminTestimonial | "new" | null>(null);

  const upsert = (t: AdminTestimonial) => setItems((l) => (l.some((x) => x.id === t.id) ? l.map((x) => (x.id === t.id ? t : x)) : [t, ...l]));

  async function togglePublished(t: AdminTestimonial, published: boolean) {
    upsert({ ...t, published });
    await run(() => saveTestimonial(t.id, { ...t, published }), {
      success: published ? "Shown on the website." : "Hidden from the website.",
      onError: () => upsert(t),
    });
  }

  async function remove(t: AdminTestimonial) {
    const yes = await confirm({ title: `Delete ${t.author}'s testimonial?`, confirmLabel: "Delete", destructive: true });
    if (yes) await run(() => deleteTestimonial(t.id), { success: "Deleted.", onSuccess: () => setItems((l) => l.filter((x) => x.id !== t.id)) });
  }

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Testimonials"
        description="Real words from real clients — with their permission. Drag to set the order on the homepage."
        actions={
          <Button variant="green-solid" onClick={() => setEditing("new")}>
            <PlusIcon weight="bold" /> Add testimonial
          </Button>
        }
      />
      {items.length ? (
        <SortableList
          label="Testimonials"
          items={items}
          setItems={setItems}
          onReorder={(ids) => reorderRows("testimonials", ids)}
          renderItem={(t) => (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="relative size-11 shrink-0 overflow-hidden rounded-full bg-ink">
                  {t.avatar_url ? (
                    <Image src={t.avatar_url} alt="" fill sizes="44px" className="object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center font-display text-gold">{t.author.slice(0, 1)}</span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">
                    {t.author}
                    {t.role ? <span className="font-normal text-muted"> · {t.role}</span> : null}
                  </p>
                  <p className="line-clamp-2 text-muted text-sm">“{t.quote}”</p>
                  {t.rating ? <Stars value={t.rating} /> : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-28">
                  <Switch checked={t.published} onCheckedChange={(v) => void togglePublished(t, v)} label="Live" />
                </div>
                <button type="button" onClick={() => setEditing(t)} className="grid size-9 place-items-center rounded-full text-muted hover:bg-foreground/6 hover:text-foreground" aria-label={`Edit ${t.author}`}>
                  <PencilSimpleIcon />
                </button>
                <button type="button" onClick={() => void remove(t)} className="grid size-9 place-items-center rounded-full text-muted hover:bg-danger/10 hover:text-danger" aria-label={`Delete ${t.author}`}>
                  <TrashIcon />
                </button>
              </div>
            </div>
          )}
        />
      ) : (
        <EmptyState title="No testimonials yet" action={<Button variant="green-solid" onClick={() => setEditing("new")}>Add the first one</Button>}>
          Ask happy clients for a sentence or two — buyers trust other buyers.
        </EmptyState>
      )}

      {editing ? (
        <TestimonialDialog
          key={editing === "new" ? "new" : editing.id}
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(t) => {
            upsert(t);
            setEditing(null);
          }}
        />
      ) : null}
    </>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="mt-1 flex gap-0.5 text-gold-600" aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} weight={i < value ? "fill" : "regular"} className="size-3.5" />
      ))}
    </span>
  );
}

function TestimonialDialog({ item, onClose, onSaved }: { item: AdminTestimonial | null; onClose: () => void; onSaved: (t: AdminTestimonial) => void }) {
  const { pending, run } = useAction();
  const [author, setAuthor] = useState(item?.author ?? "");
  const [role, setRole] = useState(item?.role ?? "");
  const [quote, setQuote] = useState(item?.quote ?? "");
  const [rating, setRating] = useState<number | null>(item?.rating ?? 5);
  const [avatar, setAvatar] = useState<string | null>(item?.avatar_url ?? null);
  const [published, setPublished] = useState(item?.published ?? true);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  async function save() {
    await run(() => saveTestimonial(item?.id ?? null, { author, role, quote, rating, avatar_url: avatar, published }), {
      success: "Testimonial saved.",
      onSuccess: onSaved,
      onError: (r) => setErrors(Object.fromEntries(Object.entries(r.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))),
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{item ? "Edit testimonial" : "Add a testimonial"}</DialogTitle>
          <DialogDescription>Only publish words the client has agreed you can share.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" required error={errors.author}>
              {(ids) => <Input {...ids} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. Wanjiru K." className="h-11 text-sm" />}
            </Field>
            <Field label="Who they are" error={errors.role}>
              {(ids) => <Input {...ids} value={role} onChange={(e) => setRole(e.target.value)} placeholder="Buyer, Kileleshwa" className="h-11 text-sm" />}
            </Field>
          </div>
          <Field label="Quote" required hint={`${quote.length}/600`} error={errors.quote}>
            {(ids) => <Textarea {...ids} rows={4} value={quote} onChange={(e) => setQuote(e.target.value)} className="text-sm" />}
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-medium text-sm">Rating</legend>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  onClick={() => setRating(n)}
                  className={cn("grid size-10 place-items-center rounded-full hover:bg-gold-100", (rating ?? 0) >= n ? "text-gold-600" : "text-foreground/25")}
                >
                  <StarIcon weight={(rating ?? 0) >= n ? "fill" : "regular"} className="size-6" />
                </button>
              ))}
              <button type="button" onClick={() => setRating(null)} className="ml-2 text-muted text-xs underline">
                No rating
              </button>
            </div>
          </fieldset>
          <ImageUpload value={avatar} onChange={setAvatar} folder="testimonials" label="Photo (optional)" square hint="Cropped to a circle." />
          <Switch checked={published} onCheckedChange={setPublished} label="Show on the website" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="green-solid" onClick={() => void save()} disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
