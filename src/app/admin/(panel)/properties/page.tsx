import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { PropertiesTable, type ListingRow } from "@/components/admin/properties/properties-table";
import { PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { mediaUrl } from "@/lib/media";
import type { ListingStatus, ListingType, PropertyMediaRow } from "@/types/db";

export const metadata: Metadata = { title: "Listings" };

export default async function AdminPropertiesPage({ searchParams }: { searchParams: Promise<{ type?: string; status?: string }> }) {
  const { staff, supabase } = await requireStaff();
  const { type, status } = await searchParams;

  const { data, error } = await supabase
    .from("properties")
    .select(
      "id, title, ref_code, slug, listing_type, status, property_type, price_kes, price_on_request, is_featured, view_count, updated_at, area:areas(name), media:property_media(storage_path, url, is_cover, sort_order, kind)",
    )
    .order("updated_at", { ascending: false })
    .limit(1000);
  if (error) console.error("[admin/properties]", error.message);

  const rows: ListingRow[] = ((data ?? []) as unknown as (Omit<ListingRow, "cover" | "area" | "photos"> & {
    area: { name: string } | null;
    media: Pick<PropertyMediaRow, "storage_path" | "url" | "is_cover" | "sort_order" | "kind">[];
  })[]).map(({ media, area, ...r }) => {
    const images = media.filter((m) => m.kind === "image").sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);
    return { ...r, area: area?.name ?? null, cover: images[0] ? mediaUrl(images[0]) : null, photos: images.length };
  });

  return (
    <>
      <PageHeader
        eyebrow="Listings"
        title="Properties"
        description="Everything for sale, to rent and for short stays. Drafts are only visible to the team."
        actions={
          <Button asChild variant="green-solid">
            <Link href="/admin/properties/new">
              <PlusIcon weight="bold" /> New listing
            </Link>
          </Button>
        }
      />
      <PropertiesTable
        rows={rows}
        initialType={(["sale", "rent", "short_stay"] as ListingType[]).find((t) => t === type) ?? "all"}
        initialStatus={(["draft", "published", "under_offer", "sold", "let", "archived"] as ListingStatus[]).find((s) => s === status) ?? "active"}
        canDelete={can.deleteListings(staff.role)}
      />
    </>
  );
}

