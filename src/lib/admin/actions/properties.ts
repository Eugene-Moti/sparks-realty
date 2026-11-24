"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { addDays, isIsoDate, nairobiToday } from "@/lib/dates";
import { PROPERTIES_TAG } from "@/lib/queries/properties";
import { propertyTag } from "@/lib/queries/property-detail";
import { availabilityTag } from "@/lib/queries/short-stay";
import {
  type ActionResult,
  ActionError,
  dbError,
  done,
  invalid,
  ok,
  requireStaffAction,
  runAction,
} from "../auth";
import { can } from "../roles";
import { listingSlug, pricePeriodFor, propertySchema, publishProblems, type PropertyValues } from "../schemas/property";

const BUCKET = "property-media";
const uuid = z.uuid();

function refreshListing(...slugs: (string | null | undefined)[]) {
  updateTag(PROPERTIES_TAG);
  for (const s of new Set(slugs)) if (s) updateTag(propertyTag(s));
}

function toRow(v: PropertyValues) {
  const isStay = v.listing_type === "short_stay";
  return {
    title: v.title,
    listing_type: v.listing_type,
    status: v.status,
    property_type: v.property_type,
    area_id: v.area_id,
    address_line: v.address_line,
    latitude: v.latitude,
    longitude: v.longitude,
    summary: v.summary,
    description_md: v.description_md,
    price_kes: v.price_kes,
    price_period: pricePeriodFor(v.listing_type),
    price_on_request: v.price_on_request,
    service_charge_kes: v.service_charge_kes,
    deposit_months: v.listing_type === "rent" ? v.deposit_months : null,
    bedrooms: v.bedrooms,
    bathrooms: v.bathrooms,
    ensuites: v.ensuites,
    dsq: v.dsq,
    parking_spaces: v.parking_spaces,
    floor_area_sqm: v.floor_area_sqm,
    land_size_acres: v.land_size_acres,
    year_built: v.year_built,
    furnishing: v.furnishing,
    available_from: v.available_from,
    max_guests: isStay ? v.max_guests : null,
    min_nights: isStay ? (v.min_nights ?? 1) : 1,
    check_in_time: isStay ? v.check_in_time : null,
    check_out_time: isStay ? v.check_out_time : null,
    cleaning_fee_kes: isStay ? v.cleaning_fee_kes : null,
    house_rules_md: isStay ? v.house_rules_md : null,
    amenities: [...new Set(v.amenities)],
    tags: [...new Set(v.tags)],
    is_featured: v.is_featured,
    youtube_url: v.youtube_url,
    tiktok_url: v.tiktok_url,
    instagram_url: v.instagram_url,
    virtual_tour_url: v.virtual_tour_url,
    floor_plan_url: v.floor_plan_url,
    brochure_url: v.brochure_url,
    agent_id: v.agent_id,
    seo_title: v.seo_title,
    seo_description: v.seo_description,
  };
}

export type SavedListing = { id: string; slug: string; refCode: string | null; status: string; updatedAt: string };

/**
 * Create (id = null) or update a listing. New listings get their slug from
 * the title + the ref code the database assigns (SP-0012).
 */
export async function saveProperty(id: string | null, input: unknown): Promise<ActionResult<SavedListing>> {
  return runAction("saveProperty", async () => {
    const { supabase } = await requireStaffAction();
    const parsed = propertySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const v = parsed.data;
    const row = toRow(v);

    if (!id) {
      if (v.status !== "draft") throw new ActionError("Save the listing as a draft first, then publish it.");
      const tempSlug = `draft-${crypto.randomUUID().slice(0, 8)}`;
      const { data: created, error } = await supabase
        .from("properties")
        .insert({ ...row, slug: v.slug ?? tempSlug })
        .select("id, ref_code, slug")
        .single<{ id: string; ref_code: string | null; slug: string }>();
      dbError(error);
      if (!created) throw new ActionError("The listing wasn't created.");
      let slug = created.slug;
      if (!v.slug) {
        slug = listingSlug(v.title, created.ref_code);
        const { error: slugError } = await supabase.from("properties").update({ slug }).eq("id", created.id);
        if (slugError) slug = created.slug; // keep the temporary slug rather than failing the save
      }
      refreshListing(slug);
      return ok({ id: created.id, slug, refCode: created.ref_code, status: v.status, updatedAt: new Date().toISOString() });
    }

    if (!uuid.safeParse(id).success) throw new ActionError("Unknown listing.");
    const { data: existing, error: readError } = await supabase
      .from("properties")
      .select("slug, status, ref_code")
      .eq("id", id)
      .maybeSingle<{ slug: string; status: string; ref_code: string | null }>();
    dbError(readError);
    if (!existing) throw new ActionError("This listing no longer exists.");

    if (v.status === "published" && existing.status !== "published") {
      const { count } = await supabase
        .from("property_media")
        .select("id", { count: "exact", head: true })
        .eq("property_id", id)
        .eq("kind", "image");
      const problems = publishProblems(v, count ?? 0);
      if (problems.length) throw new ActionError(`Before publishing: ${problems.join(" ")}`);
    }

    // Drafts follow their title; live listings keep their address unless staff change it.
    const slug = v.slug ?? (existing.status === "draft" || existing.slug.startsWith("draft-") ? listingSlug(v.title, existing.ref_code) : existing.slug);

    const { data: updated, error } = await supabase
      .from("properties")
      .update({ ...row, slug })
      .eq("id", id)
      .select("updated_at")
      .single<{ updated_at: string }>();
    if (error?.code === "23505") throw new ActionError("Another listing already uses that web address. Change the slug (SEO tab).");
    dbError(error);

    refreshListing(existing.slug, slug);
    return ok({ id, slug, refCode: existing.ref_code, status: v.status, updatedAt: updated?.updated_at ?? new Date().toISOString() });
  });
}

const bulkSchema = z.object({ ids: z.array(z.uuid()).min(1).max(200), status: z.enum(["published", "archived", "draft"]) });

/** Publish / archive / unpublish many listings. Listings that can't go live are skipped and reported. */
export async function bulkSetStatus(input: unknown): Promise<ActionResult<{ changed: number; skipped: string[] }>> {
  return runAction("bulkSetStatus", async () => {
    const { supabase } = await requireStaffAction();
    const parsed = bulkSchema.safeParse(input);
    if (!parsed.success) throw new ActionError("Choose at least one listing.");
    const { ids, status } = parsed.data;

    const { data, error } = await supabase
      .from("properties")
      .select("id, slug, title, area_id, price_kes, price_on_request, listing_type, max_guests, media:property_media(kind)")
      .in("id", ids);
    dbError(error);
    const rows = (data ?? []) as unknown as {
      id: string;
      slug: string;
      title: string;
      area_id: string | null;
      price_kes: number | null;
      price_on_request: boolean;
      listing_type: PropertyValues["listing_type"];
      max_guests: number | null;
      media: { kind: string }[];
    }[];

    const skipped: string[] = [];
    const okIds = rows
      .filter((r) => {
        if (status !== "published") return true;
        const problems = publishProblems(
          { area_id: r.area_id, price_kes: r.price_kes, price_on_request: r.price_on_request, listing_type: r.listing_type, max_guests: r.max_guests } as PropertyValues,
          r.media.filter((m) => m.kind === "image").length,
        );
        if (problems.length) skipped.push(r.title);
        return problems.length === 0;
      })
      .map((r) => r.id);

    if (okIds.length) {
      const { error: upError } = await supabase.from("properties").update({ status }).in("id", okIds);
      dbError(upError);
    }
    refreshListing(...rows.map((r) => r.slug));
    return ok({ changed: okIds.length, skipped });
  });
}

/** Copy a listing (and its media rows) as a new draft. Files are shared, not copied. */
export async function duplicateProperty(id: string): Promise<ActionResult<{ id: string }>> {
  return runAction("duplicateProperty", async () => {
    const { supabase } = await requireStaffAction();
    if (!uuid.safeParse(id).success) throw new ActionError("Unknown listing.");
    const { data: src, error } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
    dbError(error);
    if (!src) throw new ActionError("This listing no longer exists.");

    const copy = omit(src as Record<string, unknown>, ["id", "ref_code", "slug", "view_count", "published_at", "created_at", "updated_at", "search_tsv"]);
    const { data: created, error: insError } = await supabase
      .from("properties")
      .insert({ ...copy, title: `Copy of ${src.title}`.slice(0, 140), status: "draft", slug: `draft-${crypto.randomUUID().slice(0, 8)}` })
      .select("id, ref_code")
      .single<{ id: string; ref_code: string | null }>();
    dbError(insError);
    if (!created) throw new ActionError("The copy wasn't created.");
    await supabase.from("properties").update({ slug: listingSlug(`Copy of ${src.title}`, created.ref_code) }).eq("id", created.id);

    const { data: media } = await supabase.from("property_media").select("*").eq("property_id", id);
    if (media?.length) {
      const rows = media.map((m) => ({ ...omit(m, ["id", "created_at"]), property_id: created.id }));
      await supabase.from("property_media").insert(rows);
    }
    updateTag(PROPERTIES_TAG);
    return ok({ id: created.id });
  });
}

/** Admins only: permanently delete a listing and any files no other listing uses. */
export async function deleteProperty(id: string): Promise<ActionResult> {
  return runAction("deleteProperty", async () => {
    const { staff, supabase } = await requireStaffAction();
    if (!can.deleteListings(staff.role)) throw new ActionError("Only an admin can delete listings. Archive it instead.");
    if (!uuid.safeParse(id).success) throw new ActionError("Unknown listing.");

    const { data: prop } = await supabase.from("properties").select("slug, floor_plan_url, brochure_url").eq("id", id).maybeSingle();
    const { data: media } = await supabase.from("property_media").select("storage_path").eq("property_id", id);
    const paths = [
      ...(media ?? []).map((m) => m.storage_path as string | null),
      prop?.floor_plan_url as string | null,
      prop?.brochure_url as string | null,
    ].filter((p): p is string => !!p && !p.startsWith("http"));

    const { error } = await supabase.from("properties").delete().eq("id", id);
    dbError(error);
    await removeUnusedFiles(supabase, paths);
    refreshListing(prop?.slug as string | undefined);
    return done;
  });
}

function omit<T extends Record<string, unknown>>(obj: T, keys: string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
}

type Client = Awaited<ReturnType<typeof requireStaffAction>>["supabase"];

/** Delete storage files unless another media row still points at them (duplicates share files). */
async function removeUnusedFiles(supabase: Client, paths: string[]) {
  if (!paths.length) return;
  const { data: still } = await supabase.from("property_media").select("storage_path").in("storage_path", paths);
  const used = new Set((still ?? []).map((r) => r.storage_path as string));
  const unused = paths.filter((p) => !used.has(p));
  if (unused.length) await supabase.storage.from(BUCKET).remove(unused);
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

const mediaInput = z.object({
  storage_path: z.string().max(300).regex(/^[\w\-./]+$/),
  width: z.number().int().positive().max(20_000),
  height: z.number().int().positive().max(20_000),
  blur_data: z.string().max(4_000).regex(/^data:image\/(webp|jpeg|png);base64,/).nullable(),
  alt: z.string().max(200).nullable(),
  room_label: z.string().max(60).nullable(),
});

export type AdminMedia = {
  id: string;
  storage_path: string | null;
  url: string | null;
  alt: string | null;
  room_label: string | null;
  width: number | null;
  height: number | null;
  blur_data: string | null;
  sort_order: number;
  is_cover: boolean;
};

const MEDIA_COLS = "id, storage_path, url, alt, room_label, width, height, blur_data, sort_order, is_cover";

async function slugOf(supabase: Client, propertyId: string) {
  const { data } = await supabase.from("properties").select("slug").eq("id", propertyId).maybeSingle();
  return data?.slug as string | undefined;
}

/** Record an uploaded photo (the browser uploads the file itself, then calls this). */
export async function addPropertyImage(propertyId: string, input: unknown): Promise<ActionResult<AdminMedia>> {
  return runAction("addPropertyImage", async () => {
    const { supabase } = await requireStaffAction();
    if (!uuid.safeParse(propertyId).success) throw new ActionError("Unknown listing.");
    const parsed = mediaInput.safeParse(input);
    if (!parsed.success || !parsed.data.storage_path.startsWith(`${propertyId}/`)) throw new ActionError("That upload couldn't be saved.");

    const { data: last } = await supabase
      .from("property_media")
      .select("sort_order, is_cover")
      .eq("property_id", propertyId)
      .eq("kind", "image")
      .order("sort_order", { ascending: false });
    const nextOrder = (last?.[0]?.sort_order ?? -1) + 1;
    const hasCover = (last ?? []).some((m) => m.is_cover);

    const { data, error } = await supabase
      .from("property_media")
      .insert({ ...parsed.data, property_id: propertyId, kind: "image", sort_order: nextOrder, is_cover: !hasCover })
      .select(MEDIA_COLS)
      .single<AdminMedia>();
    dbError(error);
    refreshListing(await slugOf(supabase, propertyId));
    return ok(data as AdminMedia);
  });
}

const mediaPatch = z.object({ alt: z.string().max(200).nullable().optional(), room_label: z.string().max(60).nullable().optional() });

export async function updatePropertyImage(mediaId: string, patch: unknown): Promise<ActionResult> {
  return runAction("updatePropertyImage", async () => {
    const { supabase } = await requireStaffAction();
    const parsed = mediaPatch.safeParse(patch);
    if (!uuid.safeParse(mediaId).success || !parsed.success) throw new ActionError("Couldn't save that change.");
    const clean = Object.fromEntries(Object.entries(parsed.data).map(([k, v]) => [k, typeof v === "string" ? v.trim() || null : v]));
    const { data, error } = await supabase.from("property_media").update(clean).eq("id", mediaId).select("property_id").single();
    dbError(error);
    refreshListing(await slugOf(supabase, data?.property_id as string));
    return done;
  });
}

/** Save a new photo order; the first photo becomes the cover only if `coverFirst`. */
export async function reorderPropertyImages(propertyId: string, ids: string[]): Promise<ActionResult> {
  return runAction("reorderPropertyImages", async () => {
    const { supabase } = await requireStaffAction();
    if (!uuid.safeParse(propertyId).success || !z.array(z.uuid()).max(300).safeParse(ids).success) {
      throw new ActionError("Couldn't save the new order.");
    }
    const results = await Promise.all(
      ids.map((id, i) => supabase.from("property_media").update({ sort_order: i }).eq("id", id).eq("property_id", propertyId)),
    );
    dbError(results.find((r) => r.error)?.error ?? null);
    refreshListing(await slugOf(supabase, propertyId));
    return done;
  });
}

export async function setCoverImage(propertyId: string, mediaId: string): Promise<ActionResult> {
  return runAction("setCoverImage", async () => {
    const { supabase } = await requireStaffAction();
    if (!uuid.safeParse(propertyId).success || !uuid.safeParse(mediaId).success) throw new ActionError("Unknown photo.");
    const { error: e1 } = await supabase.from("property_media").update({ is_cover: false }).eq("property_id", propertyId);
    dbError(e1);
    const { error: e2 } = await supabase.from("property_media").update({ is_cover: true }).eq("id", mediaId).eq("property_id", propertyId);
    dbError(e2);
    refreshListing(await slugOf(supabase, propertyId));
    return done;
  });
}

export async function deletePropertyImage(mediaId: string): Promise<ActionResult> {
  return runAction("deletePropertyImage", async () => {
    const { supabase } = await requireStaffAction();
    if (!uuid.safeParse(mediaId).success) throw new ActionError("Unknown photo.");
    const { data: media, error } = await supabase
      .from("property_media")
      .delete()
      .eq("id", mediaId)
      .select("property_id, storage_path, is_cover")
      .single<{ property_id: string; storage_path: string | null; is_cover: boolean }>();
    dbError(error);
    if (!media) return done;
    if (media.storage_path) await removeUnusedFiles(supabase, [media.storage_path]);
    // Keep a cover: promote the next photo.
    if (media.is_cover) {
      const { data: next } = await supabase
        .from("property_media")
        .select("id")
        .eq("property_id", media.property_id)
        .eq("kind", "image")
        .order("sort_order")
        .limit(1);
      if (next?.[0]) await supabase.from("property_media").update({ is_cover: true }).eq("id", next[0].id);
    }
    refreshListing(await slugOf(supabase, media.property_id));
    return done;
  });
}

/** Remove an uploaded floor plan / brochure file (the form clears the field). */
export async function removeListingFile(path: string): Promise<ActionResult> {
  return runAction("removeListingFile", async () => {
    const { supabase } = await requireStaffAction();
    if (!/^[\w\-./]+$/.test(path) || !path.includes("/docs/")) throw new ActionError("Unknown file.");
    await supabase.storage.from(BUCKET).remove([path]);
    return done;
  });
}

// ---------------------------------------------------------------------------
// Short-stay calendar
// ---------------------------------------------------------------------------

const blockInput = z
  .object({
    starts_on: z.string().refine(isIsoDate, "Pick the first night."),
    ends_on: z.string().refine(isIsoDate, "Pick the check-out day."),
    reason: z.enum(["booked", "maintenance", "owner", "pricing"]),
    nightly_override_kes: z.number().positive().max(10_000_000).nullable(),
  })
  .refine((b) => b.ends_on > b.starts_on, { path: ["ends_on"], message: "Check-out must be after the first night." })
  .refine((b) => b.reason !== "pricing" || !!b.nightly_override_kes, { path: ["nightly_override_kes"], message: "Enter the seasonal nightly rate." })
  .refine((b) => b.ends_on >= addDays(nairobiToday(), -1), { path: ["ends_on"], message: "Those dates are in the past." });

export type AdminBlock = { id: string; starts_on: string; ends_on: string; reason: string | null; nightly_override_kes: number | null };

export async function addStayBlock(propertyId: string, input: unknown): Promise<ActionResult<AdminBlock>> {
  return runAction("addStayBlock", async () => {
    const { supabase } = await requireStaffAction();
    if (!uuid.safeParse(propertyId).success) throw new ActionError("Unknown listing.");
    const parsed = blockInput.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const b = parsed.data;
    const { data, error } = await supabase
      .from("short_stay_blocks")
      .insert({ ...b, property_id: propertyId, nightly_override_kes: b.reason === "pricing" ? b.nightly_override_kes : null })
      .select("id, starts_on, ends_on, reason, nightly_override_kes")
      .single<AdminBlock>();
    dbError(error);
    updateTag(availabilityTag(propertyId));
    updateTag(PROPERTIES_TAG);
    return ok(data as AdminBlock);
  });
}

export async function deleteStayBlock(propertyId: string, blockId: string): Promise<ActionResult> {
  return runAction("deleteStayBlock", async () => {
    const { supabase } = await requireStaffAction();
    if (!uuid.safeParse(propertyId).success || !uuid.safeParse(blockId).success) throw new ActionError("Unknown dates.");
    const { error } = await supabase.from("short_stay_blocks").delete().eq("id", blockId).eq("property_id", propertyId);
    dbError(error);
    updateTag(availabilityTag(propertyId));
    updateTag(PROPERTIES_TAG);
    return done;
  });
}

