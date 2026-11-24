import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RelativeTime } from "@/components/admin/relative-time";
import { EmptyState, PageHeader, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Insights" };

export default async function PostsAdminPage() {
  const { supabase } = await requireStaff();
  const { data } = await supabase
    .from("posts")
    .select("id, title, slug, category, cover_image, published, published_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(500);
  const posts = (data ?? []) as {
    id: string;
    title: string;
    slug: string;
    category: string | null;
    cover_image: string | null;
    published: boolean;
    published_at: string | null;
    updated_at: string;
  }[];

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Insights"
        description="Market updates, buying guides and stories. Published posts appear on the homepage and the Insights page."
        actions={
          <Button asChild variant="green-solid">
            <Link href="/admin/posts/new">
              <PlusIcon weight="bold" /> New insight
            </Link>
          </Button>
        }
      />
      {posts.length ? (
        <ul className="grid gap-3">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/posts/${p.id}`}
                className="flex items-center gap-4 rounded-2xl border border-hairline bg-surface p-3 shadow-soft transition-shadow hover:shadow-lift"
              >
                <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  {p.cover_image ? <Image src={p.cover_image} alt="" fill sizes="96px" className="object-cover" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg">{p.title}</span>
                  <span className="block text-muted text-xs">
                    {p.category ?? "No category"} · updated <RelativeTime iso={p.updated_at} />
                  </span>
                </span>
                <Pill tone={p.published ? "green" : "muted"}>{p.published ? "Published" : "Draft"}</Pill>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No insights yet"
          action={
            <Button asChild variant="green-solid">
              <Link href="/admin/posts/new">Write the first one</Link>
            </Button>
          }
        >
          Helpful articles bring visitors from Google and build trust with diaspora buyers.
        </EmptyState>
      )}
    </>
  );
}
