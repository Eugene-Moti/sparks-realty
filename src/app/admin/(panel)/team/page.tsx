import type { Metadata } from "next";
import { TeamList, type TeamMember } from "@/components/admin/team/team-list";
import { requireStaff } from "@/lib/admin/auth";
import { createServiceClient, hasServiceKey } from "@/lib/supabase/service";
import type { ProfileRow } from "@/types/db";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const { staff, supabase } = await requireStaff();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, phone, whatsapp, avatar_url, bio, is_public, created_at")
    .order("role")
    .order("full_name");

  // Emails live in Supabase Auth; only admins see them (service key, server-only).
  const emails = new Map<string, { email: string | null; lastSignIn: string | null }>();
  if (staff.role === "admin" && hasServiceKey()) {
    const { data: users } = await createServiceClient().auth.admin.listUsers({ page: 1, perPage: 200 });
    for (const u of users?.users ?? []) emails.set(u.id, { email: u.email ?? null, lastSignIn: u.last_sign_in_at ?? null });
  }

  const members: TeamMember[] = ((data ?? []) as ProfileRow[]).map((p) => ({
    ...p,
    email: emails.get(p.id)?.email ?? (p.id === staff.id ? staff.email : null),
    lastSignIn: emails.get(p.id)?.lastSignIn ?? null,
  }));

  return <TeamList members={members} meId={staff.id} isAdmin={staff.role === "admin"} />;
}
