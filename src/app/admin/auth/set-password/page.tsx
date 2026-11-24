import type { Metadata } from "next";
import { SetPasswordForm } from "@/components/admin/set-password-form";

export const metadata: Metadata = { title: "Choose a password" };

export default function SetPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="eyebrow text-accent">Sparks Properties team</p>
          <h1 className="text-4xl">Choose a password</h1>
          <p className="text-muted text-sm">At least 10 characters. A short sentence is easy to remember and hard to guess.</p>
        </div>
        <SetPasswordForm />
      </div>
    </main>
  );
}
