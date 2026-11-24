"use client";

import { ArrowClockwiseIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { whatsappLink } from "@/lib/format";

/** Shared fallback for error.tsx boundaries: friendly copy, retry, and a way to reach us. */
export function ErrorView({ error, retry, scope = "site" }: { error: unknown; retry: () => void; scope?: "site" | "admin" }) {
  const digest = error instanceof Error && "digest" in error ? String((error as Error & { digest?: string }).digest ?? "") : "";

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section role="alert" className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-5 px-4 py-24 text-center sm:px-6">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.05]">
        {scope === "admin" ? "This screen didn't load" : "Sorry — this page hit a snag"}
      </h1>
      <p className="max-w-md text-muted leading-relaxed">
        {scope === "admin"
          ? "Your work elsewhere is safe. Try again; if it keeps happening, note the reference below for support."
          : "It's on our side, not yours. Try again in a moment, or message us on WhatsApp and we'll help straight away."}
      </p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Button variant="green-solid" size="lg" onClick={() => retry()}>
          <ArrowClockwiseIcon /> Try again
        </Button>
        {scope === "admin" ? (
          <Button asChild variant="gold-outline" size="lg">
            <Link href="/admin">Back to the dashboard</Link>
          </Button>
        ) : (
          <Button asChild variant="gold-outline" size="lg">
            <a href={whatsappLink("Hi Sparks Properties, a page on your website isn't loading for me.", siteConfig.contact.whatsapp.number)} target="_blank" rel="noopener noreferrer">
              <WhatsappLogoIcon weight="fill" /> WhatsApp us
            </a>
          </Button>
        )}
      </div>
      {digest ? <p className="font-mono text-muted text-xs">Reference: {digest}</p> : null}
    </section>
  );
}
