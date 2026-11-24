"use client";

import { CalendarBlankIcon, PhoneIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/helpers/classname-helper";
import { telLink, whatsappLink } from "@/lib/format";

type MobileContactBarProps = {
  phone: string;
  whatsappNumber: string;
  /** Prefilled WhatsApp message (e.g. from listingWhatsAppMessage). */
  whatsappMessage: string;
  /** Opens the viewing form; or pass `bookHref` to link somewhere instead. */
  onBookViewing?: () => void;
  bookHref?: string;
  bookLabel?: string;
  /** Render inline instead of fixed (for the /kitchen preview). */
  inline?: boolean;
  className?: string;
};

/** Sticky bottom contact bar for listing pages on phones: Call · WhatsApp · Book. */
export function MobileContactBar({
  phone,
  whatsappNumber,
  whatsappMessage,
  onBookViewing,
  bookHref,
  bookLabel = "Book viewing",
  inline,
  className,
}: MobileContactBarProps) {
  return (
    <div
      className={cn(
        "glass z-40 grid grid-cols-[auto_1fr_1fr] gap-2 border-hairline border-t px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        inline ? "relative rounded-(--radius-card) border" : "fixed inset-x-0 bottom-0 md:hidden",
        className,
      )}
    >
      <Button asChild variant="gold-outline" size="icon" className="size-12">
        <a href={telLink(phone)} aria-label="Call Sparks Properties" data-track="mobile-contact-bar">
          <PhoneIcon />
        </a>
      </Button>
      <Button asChild variant="green-solid" size="lg" className="h-12 px-3">
        <a href={whatsappLink(whatsappMessage, whatsappNumber)} target="_blank" rel="noopener noreferrer" data-track="mobile-contact-bar">
          <WhatsappLogoIcon weight="fill" /> WhatsApp
        </a>
      </Button>
      {bookHref ? (
        <Button asChild variant="solid" size="lg" className="h-12 px-3">
          <Link href={bookHref}>
            <CalendarBlankIcon /> {bookLabel}
          </Link>
        </Button>
      ) : (
        <Button variant="solid" size="lg" className="h-12 px-3" onClick={onBookViewing}>
          <CalendarBlankIcon /> {bookLabel}
        </Button>
      )}
    </div>
  );
}
