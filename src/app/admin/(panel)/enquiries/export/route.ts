import { getStaff } from "@/lib/admin/auth";
import { enquiryKindLabels, enquiryStatusLabels, sourceLabel } from "@/lib/admin/labels";
import { can } from "@/lib/admin/roles";
import { createClient } from "@/lib/supabase/server";
import type { EnquiryRow } from "@/types/db";

/** Neutralise spreadsheet formulas (=, +, -, @) and quote every cell. */
function cell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** CSV of enquiries (admins and agents). `?marketing=1` → only people who opted in to marketing. */
export async function GET(request: Request) {
  const staff = await getStaff();
  if (!staff || !can.manageLeads(staff.role)) return new Response("Forbidden", { status: 403 });

  const marketingOnly = new URL(request.url).searchParams.get("marketing") === "1";
  const supabase = await createClient();
  let query = supabase
    .from("enquiries")
    .select("*, property:properties(title, ref_code), assignee:profiles!enquiries_assigned_to_fkey(full_name)")
    .neq("status", "spam")
    .order("created_at", { ascending: false })
    .limit(10_000);
  if (marketingOnly) query = query.eq("marketing_opt_in", true);
  const { data, error } = await query;
  if (error) {
    console.error("[enquiries/export]", error.message);
    return new Response("Export failed", { status: 500 });
  }

  const header = [
    "Received",
    "Stage",
    "Type",
    "Name",
    "Phone",
    "Email",
    "Listing ref",
    "Listing",
    "Preferred date",
    "Preferred time",
    "Check-in",
    "Check-out",
    "Guests",
    "Message",
    "Source",
    "Assigned to",
    "Notes",
    "Consent given",
    "Consent recorded at",
    "Marketing opt-in",
    "Enquiry ID",
  ];
  const rows = ((data ?? []) as (EnquiryRow & { property: { title: string; ref_code: string | null } | null; assignee: { full_name: string | null } | null })[]).map(
    (e) =>
      [
        e.created_at,
        enquiryStatusLabels[e.status],
        enquiryKindLabels[e.kind],
        e.full_name,
        e.phone,
        e.email,
        e.property?.ref_code,
        e.property?.title,
        e.preferred_date,
        e.preferred_time,
        e.check_in,
        e.check_out,
        e.guests,
        e.message,
        sourceLabel(e.source),
        e.assignee?.full_name,
        e.notes,
        e.consent_given ? "Yes" : "No",
        e.consent_at,
        e.marketing_opt_in ? "Yes" : "No",
        e.id,
      ]
        .map(cell)
        .join(","),
  );

  const csv = `﻿${[header.map(cell).join(","), ...rows].join("\r\n")}`;
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(new Date());
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sparks-enquiries${marketingOnly ? "-marketing" : ""}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
