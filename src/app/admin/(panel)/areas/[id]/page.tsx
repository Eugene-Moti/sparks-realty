import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AreaEditor } from "@/components/admin/content/area-editor";
import { requireStaff } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";

export const metadata: Metadata = { title: "Edit area" };

export default async function AreaEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { staff, supabase } = await requireStaff();
  if (id === "new") return <AreaEditor area={null} canDelete={false} />;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data } = await supabase
    .from("areas")
    .select("id, name, slug, county, summary, guide_md, hero_image, latitude, longitude")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  return <AreaEditor area={data} canDelete={can.deleteListings(staff.role)} />;
}
