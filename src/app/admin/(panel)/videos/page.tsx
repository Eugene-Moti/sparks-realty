import type { Metadata } from "next";
import { VideoManager } from "@/components/admin/content/video-manager";
import { requireStaff } from "@/lib/admin/auth";
import type { AdminVideo } from "@/lib/admin/labels";

export const metadata: Metadata = { title: "House tours" };

export default async function VideosAdminPage() {
  const { supabase } = await requireStaff();
  const [{ data }, { data: listings }] = await Promise.all([
    supabase
      .from("videos")
      .select("id, platform, url, title, thumbnail, property_id, is_featured, sort_order")
      .order("sort_order")
      .order("created_at", { ascending: false }),
    supabase.from("properties").select("id, title, ref_code").neq("status", "archived").order("title").limit(1000),
  ]);
  return (
    <VideoManager
      items={(data ?? []) as AdminVideo[]}
      listings={(listings ?? []).map((l) => ({ value: l.id as string, label: `${l.title}${l.ref_code ? ` (${l.ref_code})` : ""}` }))}
    />
  );
}
