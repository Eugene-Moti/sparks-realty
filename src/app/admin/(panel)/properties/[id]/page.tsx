import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropertyEditor } from "@/components/admin/properties/property-editor";
import type { AdminBlock, AdminMedia } from "@/lib/admin/actions/properties";
import { requireStaff } from "@/lib/admin/auth";
import { agentOptions, areaOptions } from "@/lib/admin/queries";
import { can } from "@/lib/admin/roles";
import { addDays, nairobiToday } from "@/lib/dates";
import type { PropertyRow } from "@/types/db";

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { staff, supabase } = await requireStaff();

  const [{ data: listing }, { data: media }, { data: blocks }, areas, agents] = await Promise.all([
    supabase.from("properties").select("*").eq("id", id).maybeSingle<PropertyRow>(),
    supabase
      .from("property_media")
      .select("id, storage_path, url, alt, room_label, width, height, blur_data, sort_order, is_cover")
      .eq("property_id", id)
      .eq("kind", "image")
      .order("sort_order"),
    supabase
      .from("short_stay_blocks")
      .select("id, starts_on, ends_on, reason, nightly_override_kes")
      .eq("property_id", id)
      .gte("ends_on", addDays(nairobiToday(), -30))
      .order("starts_on"),
    areaOptions(supabase),
    agentOptions(supabase),
  ]);
  if (!listing) notFound();

  return (
    <PropertyEditor
      listing={listing}
      media={(media ?? []) as AdminMedia[]}
      blocks={((blocks ?? []) as AdminBlock[]).map((b) => ({ ...b, nightly_override_kes: b.nightly_override_kes === null ? null : Number(b.nightly_override_kes) }))}
      areas={areas}
      agents={agents}
      defaultAgentId={null}
      canDelete={can.deleteListings(staff.role)}
    />
  );
}
