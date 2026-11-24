import type { Metadata } from "next";
import { PropertyEditor } from "@/components/admin/properties/property-editor";
import { requireStaff } from "@/lib/admin/auth";
import { agentOptions, areaOptions } from "@/lib/admin/queries";
import { can } from "@/lib/admin/roles";

export const metadata: Metadata = { title: "New listing" };

export default async function NewPropertyPage() {
  const { staff, supabase } = await requireStaff();
  const [areas, agents] = await Promise.all([areaOptions(supabase), agentOptions(supabase)]);
  return (
    <PropertyEditor
      listing={null}
      media={[]}
      blocks={[]}
      areas={areas}
      agents={agents}
      defaultAgentId={staff.role === "agent" ? staff.id : null}
      canDelete={can.deleteListings(staff.role)}
    />
  );
}
