"use client";

import { WhatsappLogoIcon } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { cn } from "@/helpers/classname-helper";
import { whatsappLink } from "@/lib/format";

/** Listing detail pages show the MobileContactBar on phones instead. */
const DETAIL_ROUTE = /^\/(properties|short-stays)\/[^/]+$/;

/**
 * Floating WhatsApp button (bottom-right). Pulses once when the site first
 * loads (the layout persists across navigations, so it doesn't repeat).
 */
export function WhatsAppFloat({ number }: { number: string }) {
  const pathname = usePathname();
  const onDetail = DETAIL_ROUTE.test(pathname);

  return (
    // A landmark so this fixed button isn't stray content outside the page regions.
    <aside aria-label="Quick contact">
    <a
      data-track="floating-button"
      href={whatsappLink("Hi Sparks Properties, I found you on your website and I'd like some help.", number)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp with Sparks Properties (opens in a new tab)"
      className={cn(
        "group fixed right-4 bottom-4 z-40 items-center gap-2 rounded-full bg-green-600 p-3.5 text-ivory shadow-[0_18px_40px_-14px_rgb(62_122_40/0.8)] sm:right-6 sm:bottom-6",
        "animate-pulse-once transition-[transform,background-color] duration-300 ease-(--ease-out-brand) hover:scale-105 hover:bg-green-700 active:scale-95",
        onDetail ? "hidden md:flex" : "flex",
      )}
    >
      <WhatsappLogoIcon weight="fill" className="size-7" />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap font-medium text-sm transition-[max-width,margin] duration-300 ease-(--ease-out-brand) group-hover:mr-1 group-hover:max-w-40 md:block">
        Chat on WhatsApp
      </span>
    </a>
    </aside>
  );
}
