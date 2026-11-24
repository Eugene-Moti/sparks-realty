import { redirect } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { getStaff } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { createClient } from "@/lib/supabase/server";

/**
 * Signed-in staff only. The proxy already sends signed-out visitors to the
 * login page; this also turns away signed-in accounts without a profile.
 * The session is read inside Suspense (Cache Components).
 */
export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}

async function Gate({ children }: { children: ReactNode }) {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login?reason=not-staff");

  let newEnquiries = 0;
  if (can.manageLeads(staff.role)) {
    const supabase = await createClient();
    const { count } = await supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new");
    newEnquiries = count ?? 0;
  }

  return (
    <AdminShell
      staff={{
        id: staff.id,
        name: staff.fullName || staff.email || "Team member",
        email: staff.email,
        role: staff.role,
        avatarUrl: staff.avatarUrl,
      }}
      newEnquiries={newEnquiries}
    >
      <Suspense fallback={<PageFallback />}>{children}</Suspense>
    </AdminShell>
  );
}

function ShellFallback() {
  return (
    <div className="flex min-h-dvh flex-1">
      <div className="hidden w-64 shrink-0 bg-ink lg:block" />
      <div className="flex-1 p-10">
        <PageFallback />
      </div>
    </div>
  );
}

function PageFallback() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-10 w-64 rounded-xl" />
      <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-(--radius-card)" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-(--radius-card)" />
    </div>
  );
}
