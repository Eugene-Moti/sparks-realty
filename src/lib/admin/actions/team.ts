"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { absoluteUrl } from "@/config/site";
import { PROPERTIES_TAG } from "@/lib/queries/properties";
import { SITE_SETTINGS_TAG } from "@/lib/queries/site-settings";
import { TEAM_TAG } from "@/lib/queries/team";
import { createServiceClient, hasServiceKey } from "@/lib/supabase/service";
import { type ActionResult, ActionError, dbError, done, invalid, ok, requireStaffAction, runAction } from "../auth";
import { STAFF_ROLES } from "../roles";
import { optText } from "../schemas/property";


const uuid = z.uuid();
const optPhone = z.preprocess(
  (v) => (typeof v === "string" ? v.replace(/[^\d+]/g, "") || null : null),
  z.string().regex(/^\+?\d{9,15}$/, "Use a full number, e.g. +254712345678.").nullable(),
);

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter a name.").max(80),
  phone: optPhone,
  whatsapp: optPhone,
  bio: optText(800, "Bio"),
  avatar_url: z.preprocess((v) => (typeof v === "string" ? v || null : (v ?? null)), z.url({ protocol: /^https$/ }).max(600).nullable()),
  is_public: z.boolean(),
  role: z.enum(STAFF_ROLES).optional(),
});

/** Staff edit their own profile; admins edit anyone's (and roles). The DB also blocks self-promotion. */
export async function updateProfile(id: string, input: unknown): Promise<ActionResult> {
  return runAction("updateProfile", async () => {
    const { staff, supabase } = await requireStaffAction();
    if (!uuid.safeParse(id).success) throw new ActionError("Unknown team member.");
    const isAdmin = staff.role === "admin";
    if (id !== staff.id && !isAdmin) throw new ActionError("You can only edit your own profile.");
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const { role, ...rest } = parsed.data;
    const patch = isAdmin && role ? { ...rest, role } : rest;
    const { error } = await supabase.from("profiles").update(patch).eq("id", id);
    dbError(error);
    updateTag(TEAM_TAG);
    updateTag(PROPERTIES_TAG);
    return done;
  });
}

const inviteSchema = z.object({
  email: z.email("Enter their work email.").max(160),
  full_name: z.string().trim().min(2, "Enter their name.").max(80),
  role: z.enum(STAFF_ROLES),
});

/** Admins only: email an invitation and create the staff profile. */
export async function inviteStaff(input: unknown): Promise<ActionResult<{ existing: boolean }>> {
  return runAction("inviteStaff", async () => {
    const { staff, supabase } = await requireStaffAction(["admin"]);
    const parsed = inviteSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    if (!hasServiceKey()) throw new ActionError("Invitations need SUPABASE_SERVICE_ROLE_KEY on the server.");
    const { email, full_name, role } = parsed.data;
    const service = createServiceClient();

    let userId: string | null = null;
    let existing = false;
    const { data, error } = await service.auth.admin.inviteUserByEmail(email.toLowerCase(), {
      redirectTo: absoluteUrl("/admin/auth/callback?next=/admin/auth/set-password"),
      data: { full_name, invited_by: staff.id },
    });
    if (error) {
      // Already has an account (e.g. a past team member): find it and grant access.
      if (!/already|registered|exists/i.test(error.message)) {
        console.error("[inviteStaff]", error.message);
        throw new ActionError("Couldn't send the invitation. Check the email and try again.");
      }
      existing = true;
      for (let page = 1; page <= 20 && !userId; page++) {
        const { data: list } = await service.auth.admin.listUsers({ page, perPage: 200 });
        userId = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
        if (!list || list.users.length < 200) break;
      }
      if (!userId) throw new ActionError("That email already has an account but couldn't be found. Try again.");
    } else {
      userId = data.user?.id ?? null;
    }
    if (!userId) throw new ActionError("The invitation didn't return a user.");

    const { error: profileError } = await supabase.from("profiles").upsert({ id: userId, full_name, role }, { onConflict: "id" });
    dbError(profileError);
    updateTag(TEAM_TAG);
    return ok({ existing });
  });
}

/** Admins only: remove someone's admin access (their leads and listings stay). */
export async function removeStaff(id: string): Promise<ActionResult> {
  return runAction("removeStaff", async () => {
    const { staff, supabase } = await requireStaffAction(["admin"]);
    if (!uuid.safeParse(id).success) throw new ActionError("Unknown team member.");
    if (id === staff.id) throw new ActionError("You can't remove yourself. Ask another admin.");
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    dbError(error);
    // Sign them out everywhere straight away.
    if (hasServiceKey()) await createServiceClient().auth.admin.signOut(id).catch(() => undefined);
    updateTag(TEAM_TAG);
    updateTag(PROPERTIES_TAG);
    return done;
  });
}

// ---------------------------------------------------------------------------
// Site settings (admins only)
// ---------------------------------------------------------------------------

const httpsUrl = (label: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim() || null : null),
    z.url({ protocol: /^https$/, error: `${label} must be a full https:// link.` }).max(300).nullable(),
  );
const statNumber = z.preprocess((v) => (v === "" || v === null ? 0 : Number(v)), z.number().int("Whole numbers only.").min(0).max(1_000_000));

const settingsSchema = z.object({
  company_name: z.string().trim().min(2).max(80),
  phone: z.preprocess((v) => (typeof v === "string" ? v.replace(/[^\d+]/g, "") : v), z.string().regex(/^\+\d{9,15}$/, "Use the international format, e.g. +254792573443.")),
  whatsapp: z.preprocess((v) => (typeof v === "string" ? v.replace(/\D/g, "") : v), z.string().regex(/^\d{9,15}$/, "Digits only with the country code, e.g. 254792573443.")),
  email: z.email("Enter a valid email.").max(160),
  address: z.string().trim().min(2).max(160),
  office_hours: z.string().trim().max(120),
  youtube: httpsUrl("YouTube"),
  facebook: httpsUrl("Facebook"),
  instagram: httpsUrl("Instagram"),
  tiktok: httpsUrl("TikTok"),
  hero_headline: z.string().trim().min(6, "Write a headline.").max(120),
  hero_subline: z.string().trim().max(200),
  hero_video_url: httpsUrl("Hero video"),
  stats: z.object({ homes_sold: statNumber, happy_clients: statNumber, years: statNumber, areas: statNumber }),
  usd_rate: z.preprocess((v) => Number(v), z.number({ error: "Enter the rate as a number." }).min(50, "That rate looks too low.").max(500, "That rate looks too high.")),
});

export async function saveSettings(input: unknown): Promise<ActionResult> {
  return runAction("saveSettings", async () => {
    const { supabase } = await requireStaffAction(["admin"]);
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const { error } = await supabase.from("site_settings").update({ ...parsed.data, updated_at: new Date().toISOString() }).eq("id", 1);
    dbError(error);
    updateTag(SITE_SETTINGS_TAG);
    return done;
  });
}
