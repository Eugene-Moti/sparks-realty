"use client";

import { useEffect, useState } from "react";
import { cardsByIdsAction } from "@/app/actions/search";
import type { PropertyCardData } from "@/lib/queries/properties";
import { recentlyViewedStore, recordRecentlyViewed } from "@/lib/stores/recently-viewed";
import { ListingRail } from "./listing-rail";

/**
 * Records this listing in the device-only history and shows the others the
 * visitor looked at before (most recent first).
 */
export function RecentlyViewed({ currentId }: { currentId: string }) {
  const [items, setItems] = useState<PropertyCardData[]>([]);

  useEffect(() => {
    // Read the history before adding this listing, so it never lists itself.
    const previous = recentlyViewedStore.read().filter((id) => id !== currentId);
    recordRecentlyViewed(currentId);
    if (!previous.length) return;
    let cancelled = false;
    cardsByIdsAction(previous.slice(0, 10)).then((cards) => {
      if (!cancelled) setItems(cards);
    });
    return () => {
      cancelled = true;
    };
  }, [currentId]);

  return <ListingRail id="recent" eyebrow="Your history" title="Recently viewed" items={items} sharedTransition={false} />;
}
