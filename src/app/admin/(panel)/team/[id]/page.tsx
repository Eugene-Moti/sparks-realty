import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProfileEditor } from "@/components/admin/team/profile-editor";
import { requireStaff } from "@/lib/admin/auth";
import type { ProfileRow } from "@/types/db";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { staff, supabase } = await requireStaff();
  if (id === "me") redirect(`/admin/team/${staff.id}`);
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  if (id !== staff.id && staff.role !== "admin") redirect("/admin/team");

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, phone, whatsapp, avatar_url, bio, is_public, created_at")
    .eq("id", id)
    .maybeSingle<ProfileRow>();
  if (!data) notFound();
  return <ProfileEditor profile={data} isSelf={id === staff.id} isAdmin={staff.role === "admin"} />;
}
