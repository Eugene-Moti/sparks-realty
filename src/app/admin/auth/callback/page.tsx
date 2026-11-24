import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCallback } from "@/components/admin/auth-callback";

export const metadata: Metadata = { title: "Signing you in" };

/** Lands sign-in links, invitations and password resets (see AuthCallback). */
export default function AuthCallbackPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Suspense fallback={null}>
        <AuthCallback />
      </Suspense>
    </main>
  );
}
