"use client";

import { ArrowLeftIcon, ArrowSquareOutIcon, FloppyDiskIcon, TrashIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormSection } from "@/components/admin/form-fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { PageHeader, Pill, Switch, useConfirm } from "@/components/admin/ui";
import { useAction } from "@/components/admin/use-action";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { deletePost, savePost } from "@/lib/admin/actions/content";
import { POST_CATEGORIES } from "@/lib/admin/labels";
import { slugify } from "@/lib/admin/schemas/property";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body_md: string | null;
  cover_image: string | null;
  category: string | null;
  tags: string[] | null;
  published: boolean;
  published_at: string | null;
};

export function PostEditor({ post }: { post: Post | null }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { pending, run } = useAction();
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [body, setBody] = useState(post?.body_md ?? "");
  const [cover, setCover] = useState<string | null>(post?.cover_image ?? null);
  const [category, setCategory] = useState(post?.category ?? "");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [published, setPublished] = useState(post?.published ?? false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  async function save(nextPublished = published) {
    if (nextPublished && !post?.published) {
      const yes = await confirm({
        title: "Publish this insight?",
        description: "It appears on the website straight away, on the homepage and the Insights page.",
        confirmLabel: "Publish",
      });
      if (!yes) return;
    }
    await run(
      () =>
        savePost(post?.id ?? null, {
          title,
          slug: slug || null,
          excerpt,
          body_md: body,
          cover_image: cover,
          category: category || null,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          published: nextPublished,
        }),
      {
        success: nextPublished ? "Saved and live on the website." : "Draft saved.",
        onSuccess: ({ id, published: p }) => {
          setErrors({});
          setPublished(p);
          if (!post) router.replace(`/admin/posts/${id}`);
          else router.refresh();
        },
        onError: (r) => setErrors(Object.fromEntries(Object.entries(r.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))),
      },
    );
  }

  async function remove() {
    if (!post) return;
    const yes = await confirm({ title: "Delete this insight?", description: "It's removed from the website. This can't be undone.", confirmLabel: "Delete", destructive: true });
    if (yes) await run(() => deletePost(post.id), { success: "Deleted.", onSuccess: () => router.replace("/admin/posts") });
  }

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <>
      <Link href="/admin/posts" className="inline-flex w-fit items-center gap-1.5 text-muted text-sm hover:text-foreground">
        <ArrowLeftIcon /> All insights
      </Link>
      <PageHeader
        eyebrow={<Pill tone={post?.published ? "green" : "muted"}>{post?.published ? "Published" : "Draft"}</Pill>}
        title={title || "New insight"}
        actions={
          <>
            {post?.published ? (
              <Button asChild variant="ghost" size="sm" className="border border-border">
                <a href={`/insights/${post.slug}`} target="_blank" rel="noopener">
                  <ArrowSquareOutIcon /> View
                </a>
              </Button>
            ) : null}
            {post ? (
              <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/8" onClick={() => void remove()} disabled={pending}>
                <TrashIcon /> Delete
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" className="border border-border" onClick={() => void save(published)} disabled={pending}>
              <FloppyDiskIcon /> Save
            </Button>
            {!post?.published ? (
              <Button variant="green-solid" size="sm" onClick={() => void save(true)} disabled={pending}>
                Publish
              </Button>
            ) : null}
          </>
        }
      />

      <FormSection title="Headline" description="Clear beats clever: say what the reader will learn.">
        <Field label="Title" required error={errors.title}>
          {(ids) => (
            <Input
              {...ids}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="e.g. Buying in Nairobi from abroad: a step-by-step guide"
              className="h-11 text-sm"
            />
          )}
        </Field>
        <Field label="Web address" hint={`/insights/${slug || "…"}`} error={errors.slug}>
          {(ids) => (
            <Input
              {...ids}
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              className="h-11 font-mono text-sm"
            />
          )}
        </Field>
        <Field label="Excerpt" hint={`${excerpt.length}/300 · shown on cards and in Google`} error={errors.excerpt}>
          {(ids) => <Textarea {...ids} rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="text-sm" />}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" error={errors.category}>
            {(ids) => (
              <Select
                {...ids}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Choose a category"
                options={POST_CATEGORIES.map((c) => ({ value: c, label: c }))}
                className="[&_select]:h-11 [&_select]:text-sm"
              />
            )}
          </Field>
          <Field label="Tags" hint="Comma-separated, e.g. diaspora, mortgages" error={errors.tags}>
            {(ids) => <Input {...ids} value={tags} onChange={(e) => setTags(e.target.value)} className="h-11 text-sm" />}
          </Field>
        </div>
      </FormSection>

      <FormSection title="Cover image" description="Wide and calm. Also used when the post is shared on WhatsApp.">
        <ImageUpload value={cover} onChange={setCover} folder="posts" label="Cover" hint="Landscape, at least 1600px wide." />
      </FormSection>

      <FormSection title="Article" description={`${words.toLocaleString("en-KE")} words · about ${Math.max(1, Math.round(words / 220))} min read`}>
        <MarkdownEditor
          label="Article text"
          value={body}
          onChange={setBody}
          imageFolder="posts"
          error={errors.body_md}
          rows={22}
          hint="Paste a YouTube, TikTok or Instagram link on its own line to add a video (it loads only when readers press play)."
        />
        {post ? (
          <Switch
            checked={published}
            onCheckedChange={(v) => void save(v)}
            label="Published"
            description="Turn off to take the post down without deleting it."
          />
        ) : null}
      </FormSection>
    </>
  );
}
