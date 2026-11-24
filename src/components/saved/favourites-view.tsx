"use client";

import { HeartIcon, ShareNetworkIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { cardsByIdsAction } from "@/app/actions/search";
import { PropertyCard, PropertyCardSkeleton } from "@/components/property/property-card";
import { useContact } from "@/components/providers/contact-provider";
import { Button } from "@/components/ui/button";
import { absoluteUrl } from "@/config/site";
import { whatsappLink } from "@/lib/format";
import type { PropertyCardData } from "@/lib/queries/properties";
import { useFavourites } from "@/lib/stores/favourites";

const subscribeNoop = () => () => {};

/** Favourites are stored on the visitor's device; cards are fetched fresh from the server. */
export function FavouritesView() {
  const { ids, clear } = useFavourites();
  const { whatsapp } = useContact();
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const [cards, setCards] = useState<PropertyCardData[] | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    cardsByIdsAction(key ? key.split(",") : []).then((c) => {
      if (!cancelled) setCards(c);
    });
    return () => {
      cancelled = true;
    };
  }, [key, mounted]);

  // Keep removed cards out immediately, without waiting for the refetch.
  const visible = cards?.filter((c) => ids.includes(c.id)) ?? null;

  if (!mounted || visible === null) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-(--radius-card-lg) border border-hairline border-dashed px-6 py-20 text-center">
        <HeartIcon className="size-12 text-accent" weight="thin" aria-hidden="true" />
        <p className="font-display text-3xl">No favourites yet</p>
        <p className="max-w-md text-muted text-sm leading-relaxed">
          Tap the heart on any home to keep it here. Favourites are saved on this device only —
          nothing is sent to us.
        </p>
        <Button asChild>
          <Link href="/properties">Browse homes</Link>
        </Button>
      </div>
    );
  }

  const shareText = `Hi Sparks Properties, I'd like to know more about these homes:\n${visible
    .map((c) => `• ${c.title}${c.refCode ? ` (${c.refCode})` : ""} — ${absoluteUrl(c.href)}`)
    .join("\n")}`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted text-sm">
          <span className="font-mono text-foreground">{visible.length}</span> saved {visible.length === 1 ? "home" : "homes"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="gold-outline">
            <a href={whatsappLink(shareText, whatsapp)} target="_blank" rel="noopener noreferrer">
              <ShareNetworkIcon /> Send list to an agent
            </a>
          </Button>
          <Button variant="ghost" onClick={clear}>
            Clear all
          </Button>
        </div>
      </div>
      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((c) => (
          <li key={c.id}>
            <PropertyCard property={c} className="h-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}
