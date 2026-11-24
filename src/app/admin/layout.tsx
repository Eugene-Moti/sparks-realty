import type { Metadata } from "next";
import type React from "react";
import { AdminRoot } from "@/components/admin/admin-root";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Sparks Admin" },
  robots: { index: false, follow: false },
};

/** /admin: always-light work area, no public chrome, never indexed. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="light-scope flex min-h-dvh flex-1 flex-col">
      {children}
      <AdminRoot />
    </div>
  );
}
