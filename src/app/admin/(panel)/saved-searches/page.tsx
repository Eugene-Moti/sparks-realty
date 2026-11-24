import type { Metadata } from "next";
import { SavedSearchList, type SavedSearchItem } from "@/components/admin/saved-search-list";
import { PageHeader } from "@/components/admin/ui";
import { requireStaff } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Saved searches" };

export default async function SavedSearchesPage() {
  const { supabase } = await requireStaff(["admin", "agent"]);
  const { data, error } = await supabase
    .from("saved_searches")
    .select("id, email, filters, consent_given, marketing_opt_in, consent_at, created_at")
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) console.error("[admin/saved-searches]", error.message);

  return (
    <>
      <PageHeader
        eyebrow="Leads"
        title="Saved searches & alerts"
        description="People who asked to hear about new matches or subscribed to news. Delete a row when someone unsubscribes or asks to be forgotten."
      />
      <SavedSearchList items={(data ?? []) as SavedSearchItem[]} />
    </>
  );
}
