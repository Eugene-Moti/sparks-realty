import type { Metadata } from "next";
import { EnquiryBoard, type InboxEnquiry } from "@/components/admin/enquiries/enquiry-board";
import { requireStaff } from "@/lib/admin/auth";
import { agentOptions } from "@/lib/admin/queries";
import { can } from "@/lib/admin/roles";

export const metadata: Metadata = { title: "Enquiries" };

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ open?: string; log?: string }> }) {
  const { staff, supabase } = await requireStaff(["admin", "agent"]);
  const { open, log } = await searchParams;

  const [{ data, error }, agents, { data: listings }] = await Promise.all([
    supabase
      .from("enquiries")
      .select("*, property:properties(id, title, ref_code, slug, listing_type)")
      .order("created_at", { ascending: false })
      .limit(800),
    agentOptions(supabase),
    supabase.from("properties").select("id, title, ref_code").neq("status", "archived").order("title").limit(1000),
  ]);
  if (error) console.error("[admin/enquiries]", error.message);

  return (
    <EnquiryBoard
      enquiries={(data ?? []) as InboxEnquiry[]}
      agents={agents}
      listings={(listings ?? []).map((l) => ({ value: l.id as string, label: `${l.title}${l.ref_code ? ` (${l.ref_code})` : ""}` }))}
      me={{ id: staff.id, name: staff.fullName ?? "the Sparks Properties team" }}
      canDelete={can.deleteLeads(staff.role)}
      initialOpen={open ?? null}
      initialLog={log === "1"}
    />
  );
}
