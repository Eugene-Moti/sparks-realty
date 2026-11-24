import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { ProfileRow } from "@/types/db";

/** Cache tag for public team profiles (Admin → Team saves refresh it). */
export const TEAM_TAG = "team";

export type TeamMember = Pick<ProfileRow, "id" | "full_name" | "avatar_url" | "bio" | "phone" | "whatsapp" | "role">;

/** Staff who turned on "Show on Our Team" (RLS only exposes those rows to the public). */
export async function getPublicTeam(): Promise<TeamMember[]> {
  "use cache";
  cacheTag(TEAM_TAG);
  cacheLife("hours");
  if (!hasSupabaseEnv()) return [];
  const { data, error } = await createPublicClient()
    .from("profiles")
    .select("id, full_name, avatar_url, bio, phone, whatsapp, role")
    .eq("is_public", true)
    .order("created_at")
    .overrideTypes<TeamMember[], { merge: false }>();
  if (error) console.error("[getPublicTeam]", error.message);
  return (data ?? []).filter((m) => m.full_name);
}
