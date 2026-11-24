import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { AreaList, type AreaItem } from "@/components/admin/content/area-list";
import { PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Areas" };

export default async function AreasAdminPage() {
  const { supabase } = await requireStaff();
  const [{ data: areas }, { data: props }] = await Promise.all([
    supabase.from("areas").select("id, name, slug, summary, hero_image, guide_md, sort_order").order("sort_order").order("name"),
    supabase.from("properties").select("area_id").in("status", ["published", "under_offer"]),
  ]);
  const counts = new Map<string, number>();
  for (const p of props ?? []) if (p.area_id) counts.set(p.area_id as string, (counts.get(p.area_id as string) ?? 0) + 1);

  const items: AreaItem[] = (areas ?? []).map((a) => ({
    id: a.id as string,
    name: a.name as string,
    slug: a.slug as string,
    summary: a.summary as string | null,
    heroImage: a.hero_image as string | null,
    hasGuide: !!a.guide_md,
    listings: counts.get(a.id as string) ?? 0,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Areas"
        description="Neighbourhood guides. The order here is the order on the website (homepage strip, filters and the areas page)."
        actions={
          <Button asChild variant="green-solid">
            <Link href="/admin/areas/new">
              <PlusIcon weight="bold" /> New area
            </Link>
          </Button>
        }
      />
      <AreaList items={items} />
    </>
  );
}
