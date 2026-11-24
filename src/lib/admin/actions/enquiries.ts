"use server";

import { z } from "zod";
import { DIAL_CODES, toE164 } from "@/lib/validation/phone";
import type { EnquiryStatus } from "@/types/db";
import { type ActionResult, ActionError, dbError, done, invalid, ok, requireStaffAction, runAction } from "../auth";
import { LOG_CHANNELS } from "../labels";
import { can } from "../roles";

const LEADS = ["admin", "agent"] as const;
const uuid = z.uuid();
const STATUSES = ["new", "contacted", "qualified", "closed", "spam"] as const satisfies readonly EnquiryStatus[];

const patchSchema = z
  .object({
    status: z.enum(STATUSES).optional(),
    assigned_to: z.uuid().nullable().optional(),
    notes: z.string().max(5000, "Notes are too long.").nullable().optional(),
  })
  .strict();

/** Move a lead (Kanban drag, drawer), assign it, or save notes. */
export async function updateEnquiry(id: string, patch: unknown): Promise<ActionResult<{ updatedAt: string }>> {
  return runAction("updateEnquiry", async () => {
    const { supabase } = await requireStaffAction(LEADS);
    if (!uuid.safeParse(id).success) throw new ActionError("Unknown enquiry.");
    const parsed = patchSchema.safeParse(patch);
    if (!parsed.success) return invalid(parsed.error);
    const clean = { ...parsed.data, ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes?.trim() || null } : {}) };
    const { data, error } = await supabase.from("enquiries").update(clean).eq("id", id).select("updated_at").single<{ updated_at: string }>();
    dbError(error);
    return ok({ updatedAt: data?.updated_at ?? new Date().toISOString() });
  });
}

/** Admins only — for data-erasure requests (Kenya DPA). */
export async function deleteEnquiry(id: string): Promise<ActionResult> {
  return runAction("deleteEnquiry", async () => {
    const { staff, supabase } = await requireStaffAction(LEADS);
    if (!can.deleteLeads(staff.role)) throw new ActionError("Only an admin can delete enquiries.");
    if (!uuid.safeParse(id).success) throw new ActionError("Unknown enquiry.");
    const { error } = await supabase.from("enquiries").delete().eq("id", id);
    dbError(error);
    return done;
  });
}

const logSchema = z
  .object({
    full_name: z.string().trim().min(2, "Enter the client's name.").max(120),
    phone_country: z.enum(DIAL_CODES),
    phone: z.string().trim().max(24),
    email: z.union([z.literal(""), z.email("That email doesn't look right.").max(160)]),
    kind: z.enum(["general", "property", "viewing", "short_stay", "list_with_us", "diaspora"]),
    channel: z.enum(LOG_CHANNELS),
    property_id: z.union([z.literal(""), z.uuid()]),
    message: z.string().trim().max(3000),
    assigned_to: z.union([z.literal(""), z.uuid()]),
    consent_given: z.literal(true, { error: "Confirm the client agreed to us keeping their details." }),
    marketing_opt_in: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (!v.phone && !v.email) ctx.addIssue({ code: "custom", path: ["phone"], message: "Add a phone number or an email." });
    if (v.phone && !toE164(v.phone_country, v.phone)) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "That phone number doesn't look right." });
    }
  });

/** Staff log a lead that came by phone, WhatsApp, walk-in… (consent recorded the same way as web forms). */
export async function logEnquiry(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction("logEnquiry", async () => {
    const { staff, supabase } = await requireStaffAction(LEADS);
    const parsed = logSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const v = parsed.data;
    const id = crypto.randomUUID();
    const { error } = await supabase.from("enquiries").insert({
      id,
      kind: v.kind,
      status: "contacted",
      full_name: v.full_name,
      phone: v.phone ? toE164(v.phone_country, v.phone) : null,
      email: v.email ? v.email.toLowerCase() : null,
      property_id: v.property_id || null,
      message: v.message || null,
      source: `admin:${v.channel}`,
      assigned_to: v.assigned_to || staff.id,
      consent_given: true,
      marketing_opt_in: v.marketing_opt_in,
    });
    dbError(error);
    return ok({ id });
  });
}

/** Unsubscribe / erase a saved search (admins and agents). */
export async function deleteSavedSearch(id: string): Promise<ActionResult> {
  return runAction("deleteSavedSearch", async () => {
    const { supabase } = await requireStaffAction(LEADS);
    if (!uuid.safeParse(id).success) throw new ActionError("Unknown saved search.");
    const { error } = await supabase.from("saved_searches").delete().eq("id", id);
    dbError(error);
    return done;
  });
}
