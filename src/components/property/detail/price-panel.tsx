"use client";

import { CalendarCheckIcon, ChatCircleTextIcon, PhoneIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { MobileContactBar } from "@/components/layout/mobile-contact-bar";
import { FavouriteButton } from "@/components/property/favourite-button";
import { useContact } from "@/components/providers/contact-provider";
import { useCurrency } from "@/components/providers/currency-provider";
import { Button } from "@/components/ui/button";
import { absoluteUrl } from "@/config/site";
import { cn } from "@/helpers/classname-helper";
import { formatMoney, listingWhatsAppLink, listingWhatsAppMessage, telLink } from "@/lib/format";
import type { PropertyAgent } from "@/lib/queries/property-detail";
import type { PricePeriod } from "@/types/db";
import { ShareButton } from "./share-button";
import { useViewing } from "./viewing-context";

export type PriceInfo = {
  priceKes: number | null;
  pricePeriod: PricePeriod | null;
  priceOnRequest: boolean;
  serviceChargeKes: number | null;
  depositMonths: number | null;
};

/** Price in the visitor's chosen currency with the other one underneath. */
export function PriceTag({ price, className, size = "lg" }: { price: PriceInfo; className?: string; size?: "md" | "lg" }) {
  const { format, currency, usdRate } = useCurrency();
  const p = format({ priceKes: price.priceKes, period: price.pricePeriod, priceOnRequest: price.priceOnRequest });
  const extra: string[] = [];
  if (price.serviceChargeKes) extra.push(`+ ${formatMoney(price.serviceChargeKes, currency, usdRate)}/month service charge`);
  if (price.depositMonths && price.pricePeriod === "month") {
    extra.push(`${Number(price.depositMonths)} month${Number(price.depositMonths) === 1 ? "" : "s"} deposit`);
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <p className={cn("font-medium font-mono tracking-tight", size === "lg" ? "text-[1.7rem] leading-tight" : "text-xl")}>
        {p.primary}
      </p>
      {p.secondary ? <p className="font-mono text-muted text-sm">{p.secondary}</p> : null}
      {extra.length ? <p className="text-muted text-xs">{extra.join(" · ")}</p> : null}
    </div>
  );
}

type PricePanelProps = {
  id: string;
  title: string;
  refCode: string | null;
  href: string;
  price: PriceInfo;
  agent: PropertyAgent | null;
  /** e.g. "Sold" — swaps the booking CTA for "Ask about similar homes". */
  ribbon?: string;
  className?: string;
};

/** Sticky right-hand column on desktop; in the page flow (after the details) on phones. */
export function PricePanel({ id, title, refCode, href, price, agent, ribbon, className }: PricePanelProps) {
  const contact = useContact();
  const { open, intent } = useViewing();
  const url = absoluteUrl(href);
  const whatsappNumber = agent?.whatsapp || contact.whatsapp;
  const phone = agent?.phone || contact.phone;
  const isViewing = intent === "viewing";

  return (
    <div className={cn("flex flex-col gap-5 rounded-(--radius-card) border border-hairline bg-surface p-6 shadow-soft", className)}>
      {ribbon ? (
        <p className="rounded-full bg-foreground py-1.5 text-center font-medium text-background text-xs uppercase tracking-[0.3em]">
          {ribbon}
        </p>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <PriceTag price={price} />
        <FavouriteButton id={id} title={title} className="shrink-0 border border-border" />
      </div>
      {refCode ? (
        <p className="flex items-center justify-between border-hairline border-y py-2.5 text-xs">
          <span className="text-muted">Reference</span>
          <span className="font-mono tracking-widest">{refCode}</span>
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button variant="green-solid" size="lg" onClick={open} className="w-full">
          {isViewing ? <CalendarCheckIcon weight="bold" /> : <ChatCircleTextIcon weight="bold" />}
          {isViewing ? "Book a viewing" : ribbon ? "Ask about similar homes" : "Ask about this home"}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="gold-outline" className="px-3">
            <a href={telLink(phone)}>
              <PhoneIcon /> Call
            </a>
          </Button>
          <Button asChild variant="green-solid" className="px-3">
            <a
              href={listingWhatsAppLink({ title, refCode, url }, whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp us about this home (opens in a new tab)"
            >
              <WhatsappLogoIcon weight="fill" /> WhatsApp
            </a>
          </Button>
        </div>
      </div>

      <AgentCard agent={agent} />

      <div className="flex items-center justify-between gap-2 border-hairline border-t pt-4">
        <p className="text-muted text-xs">Share with family</p>
        <ShareButton url={url} title={title} text={`Have a look at this home: ${title}`} />
      </div>
    </div>
  );
}

export function AgentCard({ agent }: { agent: PropertyAgent | null }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-hairline bg-ink">
        {agent?.avatar ? (
          <Image src={agent.avatar} alt="" fill sizes="56px" className="object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/brand/mark.svg" alt="" className="absolute inset-0 m-auto size-9" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-display text-lg leading-tight">{agent?.name ?? "Sparks Properties"}</p>
        <p className="text-muted text-xs">{agent ? "Your agent for this home" : "Arboretum Drive office · replies fast on WhatsApp"}</p>
      </div>
    </div>
  );
}

/** Phone-only sticky bar: Call · WhatsApp · Book. */
export function ListingMobileBar({
  title,
  refCode,
  href,
  agent,
}: {
  title: string;
  refCode: string | null;
  href: string;
  agent: PropertyAgent | null;
}) {
  const contact = useContact();
  const { open, intent } = useViewing();
  return (
    <MobileContactBar
      phone={agent?.phone || contact.phone}
      whatsappNumber={agent?.whatsapp || contact.whatsapp}
      whatsappMessage={listingWhatsAppMessage({ title, refCode, url: absoluteUrl(href) })}
      onBookViewing={open}
      bookLabel={intent === "viewing" ? "Book viewing" : "Enquire"}
    />
  );
}
