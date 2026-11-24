import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="dark relative hidden overflow-hidden bg-ink p-12 text-ivory lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[url('/textures/plastic-noise.webp')] bg-[length:180px_180px] opacity-[0.12] mix-blend-overlay"
        />
        <Image src="/brand/logo-stacked-on-dark.svg" alt="Sparks Properties" width={240} height={144} priority className="relative h-auto w-60" />
        <div className="relative flex flex-col gap-4">
          <p className="eyebrow text-gold">Team area</p>
          <p className="max-w-md font-display text-5xl leading-[1.05]">Every listing, lead and story — in one calm place.</p>
          <p className="max-w-sm text-ivory/60 text-sm">For Sparks Properties staff only.</p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <Image src="/brand/logo-compact-on-light.svg" alt="Sparks Properties" width={220} height={39} className="h-auto w-52 lg:hidden" />
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl">Staff sign-in</h1>
            <p className="text-muted text-sm">Use the email your admin invited.</p>
          </div>
          <Suspense fallback={<div className="h-72" />}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
