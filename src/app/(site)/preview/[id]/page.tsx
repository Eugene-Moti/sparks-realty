import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PropertyPage } from "@/components/property/detail/property-page";
import { Skeleton } from "@/components/ui/skeleton";
import { getStaff } from "@/lib/admin/auth";
import { listingStatusLabels } from "@/lib/admin/labels";
import { addDays, nairobiToday } from "@/lib/dates";
import { DETAIL_SELECT, type DetailRow, toDetail } from "@/lib/queries/property-detail";
import { fetchStayBlocks, stayInfo } from "@/lib/queries/short-stay";
import { BOOKING_HORIZON_DAYS } from "@/lib/short-stay/stay";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

// One placeholder path lets the shared site shell prerender; real ids render on request.
export async function generateStaticParams() {
  return [{ id: "preview" }];
}

/** Staff-only preview of any listing (drafts included), exactly as the public page renders it. */
export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-[90rem] px-4 py-10 sm:px-6 lg:px-10">
          <Skeleton className="aspect-[16/7] w-full rounded-(--radius-card-lg)" />
        </div>
      }
    >
      <Preview params={params} />
    </Suspense>
  );
}

async function Preview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const staff = await getStaff();
  if (!staff) notFound();

  const supabase = await createClient();
  const { data } = await supabase.from("properties").select(DETAIL_SELECT).eq("id", id).limit(1).overrideTypes<DetailRow[], { merge: false }>();
  const row = data?.[0];
  if (!row) notFound();
  const property = toDetail(row);

  let stay;
  if (property.listingType === "short_stay") {
    const today = nairobiToday();
    const blocks = await fetchStayBlocks(property.id, addDays(today, -1), addDays(today, BOOKING_HORIZON_DAYS + 31)).catch(() => []);
    stay = stayInfo(property, blocks);
  }

  return (
    <>
      <div className="sticky top-20 z-30 mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-3xl flex-wrap items-center justify-between gap-3 rounded-full bg-ink px-5 py-2.5 text-ivory text-sm shadow-lift">
        <span>
          <strong className="font-medium text-gold">Preview</strong> · {listingStatusLabels[row.status]}
          {row.status === "draft" || row.status === "archived" ? " — not visible to the public" : ""}
        </span>
        <Link href={`/admin/properties/${id}`} className="inline-flex items-center gap-1.5 text-gold hover:underline">
          <PencilSimpleIcon /> Back to editing
        </Link>
      </div>
      <PropertyPage property={property} similar={[]} stay={stay} preview />
    </>
  );
}
