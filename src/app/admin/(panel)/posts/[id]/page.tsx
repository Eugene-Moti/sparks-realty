import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/content/post-editor";
import { requireStaff } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Edit insight" };

export default async function PostEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireStaff();
  if (id === "new") return <PostEditor post={null} />;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, body_md, cover_image, category, tags, published, published_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  return <PostEditor post={data} />;
}
