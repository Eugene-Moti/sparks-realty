"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { parseVideoUrl } from "@/lib/embeds";
import { AREAS_TAG } from "@/lib/queries/areas";
import { POSTS_TAG, TESTIMONIALS_TAG, VIDEOS_TAG } from "@/lib/queries/content";
import { PROPERTIES_TAG } from "@/lib/queries/properties";
import { type ActionResult, ActionError, dbError, done, invalid, ok, requireStaffAction, runAction } from "../auth";
import { can } from "../roles";
import { optNumber, optText, SLUG_RE, slugify } from "../schemas/property";

const uuid = z.uuid();
const optImage = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() || null : (v ?? null)),
  z.url({ protocol: /^https$/, error: "Images must be uploaded (https link)." }).max(600).nullable(),
);
const slugField = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() || null : null),
  z.string().max(120).regex(SLUG_RE, "Use lowercase letters, numbers and hyphens only.").nullable(),
);

type Table = "areas" | "testimonials" | "videos";

/** Save a drag-and-drop order (sort_order = position). */
export async function reorderRows(table: Table, ids: string[]): Promise<ActionResult> {
  return runAction("reorderRows", async () => {
    const { supabase } = await requireStaffAction();
    if (!["areas", "testimonials", "videos"].includes(table) || !z.array(z.uuid()).max(500).safeParse(ids).success) {
      throw new ActionError("Couldn't save the new order.");
    }
    const results = await Promise.all(ids.map((id, i) => supabase.from(table).update({ sort_order: i + 1 }).eq("id", id)));
    dbError(results.find((r) => r.error)?.error ?? null);
    updateTag(table === "areas" ? AREAS_TAG : table === "testimonials" ? TESTIMONIALS_TAG : VIDEOS_TAG);
    return done;
  });
}

// ---------------------------------------------------------------------------
// Areas
// ---------------------------------------------------------------------------

const areaSchema = z.object({
  name: z.string().trim().min(2, "Enter the area name.").max(60),
  slug: slugField,
  county: z.string().trim().max(60).default("Nairobi"),
  summary: optText(400, "Summary"),
  guide_md: optText(30_000, "Guide"),
  hero_image: optImage,
  latitude: optNumber(-5, 5, "Latitude"),
  longitude: optNumber(33, 42, "Longitude"),
});

export async function saveArea(id: string | null, input: unknown): Promise<ActionResult<{ id: string; slug: string }>> {
  return runAction("saveArea", async () => {
    const { supabase } = await requireStaffAction();
    const parsed = areaSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const v = parsed.data;
    const row = { ...v, slug: v.slug ?? slugify(v.name) };
    if (id && !uuid.safeParse(id).success) throw new ActionError("Unknown area.");
    const query = id
      ? supabase.from("areas").update(row).eq("id", id).select("id, slug").single<{ id: string; slug: string }>()
      : supabase.from("areas").insert({ ...row, sort_order: 999 }).select("id, slug").single<{ id: string; slug: string }>();
    const { data, error } = await query;
    if (error?.code === "23505") throw new ActionError("An area with that name or web address already exists.");
    dbError(error);
    updateTag(AREAS_TAG);
    updateTag(PROPERTIES_TAG);
    return ok(data as { id: string; slug: string });
  });
}

export async function deleteArea(id: string): Promise<ActionResult> {
  return runAction("deleteArea", async () => {
    const { staff, supabase } = await requireStaffAction();
    if (!can.deleteListings(staff.role)) throw new ActionError("Only an admin can delete areas.");
    if (!uuid.safeParse(id).success) throw new ActionError("Unknown area.");
    const { error } = await supabase.from("areas").delete().eq("id", id);
    dbError(error);
    updateTag(AREAS_TAG);
    updateTag(PROPERTIES_TAG);
    return done;
  });
}

// ---------------------------------------------------------------------------
// Insights / posts
// ---------------------------------------------------------------------------

const postSchema = z.object({
  title: z.string().trim().min(6, "Give the post a title (at least 6 characters).").max(140),
  slug: slugField,
  excerpt: optText(300, "Excerpt"),
  body_md: optText(60_000, "Article"),
  cover_image: optImage,
  category: optText(40, "Category"),
  tags: z.array(z.string().trim().max(40)).max(20),
  published: z.boolean(),
});

export async function savePost(id: string | null, input: unknown): Promise<ActionResult<{ id: string; slug: string; published: boolean }>> {
  return runAction("savePost", async () => {
    const { staff, supabase } = await requireStaffAction();
    const parsed = postSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const v = parsed.data;
    if (v.published && !v.body_md) throw new ActionError("Write the article before publishing it.");
    if (id && !uuid.safeParse(id).success) throw new ActionError("Unknown post.");

    let publishedAt: string | null | undefined;
    if (id) {
      const { data: existing } = await supabase.from("posts").select("published_at").eq("id", id).maybeSingle();
      publishedAt = v.published ? ((existing?.published_at as string | null) ?? new Date().toISOString()) : (existing?.published_at as string | null);
    } else {
      publishedAt = v.published ? new Date().toISOString() : null;
    }

    const row = { ...v, slug: v.slug ?? slugify(v.title), tags: [...new Set(v.tags.filter(Boolean))], published_at: publishedAt };
    const query = id
      ? supabase.from("posts").update(row).eq("id", id).select("id, slug, published").single()
      : supabase.from("posts").insert({ ...row, author_id: staff.id }).select("id, slug, published").single();
    const { data, error } = await query;
    if (error?.code === "23505") throw new ActionError("Another post already uses that web address. Change the slug.");
    dbError(error);
    updateTag(POSTS_TAG);
    return ok(data as { id: string; slug: string; published: boolean });
  });
}

export async function deletePost(id: string): Promise<ActionResult> {
  return runAction("deletePost", async () => {
    const { supabase } = await requireStaffAction();
    if (!uuid.safeParse(id).success) throw new ActionError("Unknown post.");
    const { error } = await supabase.from("posts").delete().eq("id", id);
    dbError(error);
    updateTag(POSTS_TAG);
    return done;
  });
}

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

const testimonialSchema = z.object({
  author: z.string().trim().min(2, "Who said it?").max(80),
  role: optText(80, "Role"),
  quote: z.string().trim().min(10, "Add the quote (at least 10 characters).").max(600, "Keep it under 600 characters."),
  rating: z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(v)), z.number().int().min(1).max(5).nullable()),
  avatar_url: optImage,
  published: z.boolean(),
});

type AdminTestimonial = z.output<typeof testimonialSchema> & { id: string; sort_order: number };

export async function saveTestimonial(id: string | null, input: unknown): Promise<ActionResult<AdminTestimonial>> {
  return runAction("saveTestimonial", async () => {
    const { supabase } = await requireStaffAction();
    const parsed = testimonialSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    if (id && !uuid.safeParse(id).success) throw new ActionError("Unknown testimonial.");
    const cols = "id, author, role, quote, rating, avatar_url, published, sort_order";
    const query = id
      ? supabase.from("testimonials").update(parsed.data).eq("id", id).select(cols).single<AdminTestimonial>()
      : supabase.from("testimonials").insert({ ...parsed.data, sort_order: 0 }).select(cols).single<AdminTestimonial>();
    const { data, error } = await query;
    dbError(error);
    updateTag(TESTIMONIALS_TAG);
    return ok(data as AdminTestimonial);
  });
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  return runAction("deleteTestimonial", async () => {
    const { supabase } = await requireStaffAction();
    if (!uuid.safeParse(id).success) throw new ActionError("Unknown testimonial.");
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    dbError(error);
    updateTag(TESTIMONIALS_TAG);
    return done;
  });
}

// ---------------------------------------------------------------------------
// Videos (House tours)
// ---------------------------------------------------------------------------

const videoSchema = z.object({
  url: z.string().trim().max(500).refine((u) => !!parseVideoUrl(u), "Paste a YouTube, TikTok, Instagram or Facebook video link."),
  title: optText(120, "Title"),
  thumbnail: optImage,
  property_id: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.uuid().nullable()),
  is_featured: z.boolean(),
});

type AdminVideo = z.output<typeof videoSchema> & { id: string; platform: string; sort_order: number };

export async function saveVideo(id: string | null, input: unknown): Promise<ActionResult<AdminVideo>> {
  return runAction("saveVideo", async () => {
    const { supabase } = await requireStaffAction();
    const parsed = videoSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    if (id && !uuid.safeParse(id).success) throw new ActionError("Unknown video.");
    const platform = parseVideoUrl(parsed.data.url)?.platform;
    if (!platform) throw new ActionError("Unsupported video link.");
    const row = { ...parsed.data, platform };
    const cols = "id, platform, url, title, thumbnail, property_id, is_featured, sort_order";
    const query = id
      ? supabase.from("videos").update(row).eq("id", id).select(cols).single<AdminVideo>()
      : supabase.from("videos").insert({ ...row, sort_order: 0 }).select(cols).single<AdminVideo>();
    const { data, error } = await query;
    dbError(error);
    updateTag(VIDEOS_TAG);
    return ok(data as AdminVideo);
  });
}

export async function deleteVideo(id: string): Promise<ActionResult> {
  return runAction("deleteVideo", async () => {
    const { supabase } = await requireStaffAction();
    if (!uuid.safeParse(id).success) throw new ActionError("Unknown video.");
    const { error } = await supabase.from("videos").delete().eq("id", id);
    dbError(error);
    updateTag(VIDEOS_TAG);
    return done;
  });
}
