import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { NotFoundView } from "@/components/content/not-found-view";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

/** Unknown URLs (no route matched): standalone 404 with a minimal header. */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-[90rem] items-center px-4 py-5 sm:px-6 lg:px-10">
        <Link href="/" aria-label="Sparks Properties — home">
          <Image src="/brand/logo-compact-on-light.svg" alt="Sparks Properties" width={224} height={40} className="h-9 w-auto dark:hidden" />
          <Image src="/brand/logo-compact-on-dark.svg" alt="" width={224} height={40} className="hidden h-9 w-auto dark:block" />
        </Link>
      </header>
      <main id="main" className="flex flex-1 flex-col">
        <NotFoundView />
      </main>
    </div>
  );
}
