import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { addDays, nairobiToday } from "@/lib/dates";
import { BOOKING_HORIZON_DAYS, blockFromRow, type StayBlock, type StayInfo } from "@/lib/short-stay/stay";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { ShortStayBlockRow } from "@/types/db";
import type { PropertyDetail } from "./property-detail";
import { PROPERTIES_TAG } from "./properties";

/** Revalidate this (and PROPERTIES_TAG) when staff change a listing's blocked dates. */
export const availabilityTag = (propertyId: string) => `availability:${propertyId}`;

type BlockFields = Pick<ShortStayBlockRow, "starts_on" | "ends_on" | "reason" | "nightly_override_kes">;

/** Blocks overlapping [from, to). Not cached: the enquiry route re-checks live data. */
export async function fetchStayBlocks(propertyId: string, from: string, to: string): Promise<StayBlock[]> {
  if (!hasSupabaseEnv()) return [];
  const { data, error } = await createPublicClient()
    .from("short_stay_blocks")
    .select("starts_on, ends_on, reason, nightly_override_kes")
    .eq("property_id", propertyId)
    .lt("starts_on", to)
    .gt("ends_on", from)
    .order("starts_on")
    .overrideTypes<BlockFields[], { merge: false }>();
  if (error) {
    console.error("[fetchStayBlocks]", error.message);
    throw new Error("Could not check availability.");
  }
  return (data ?? []).map(blockFromRow);
}

/** Closed nights and seasonal rates for the next year, for the calendar and quote. */
export async function getStayCalendar(propertyId: string): Promise<StayBlock[]> {
  "use cache";
  cacheTag(PROPERTIES_TAG, availabilityTag(propertyId));
  cacheLife("minutes");
  const today = nairobiToday();
  try {
    return await fetchStayBlocks(propertyId, addDays(today, -1), addDays(today, BOOKING_HORIZON_DAYS + 31));
  } catch {
    return [];
  }
}

/** The client-safe booking info for a short-stay listing. */
export function stayInfo(p: PropertyDetail, blocks: StayBlock[]): StayInfo {
  return {
    propertyId: p.id,
    nightlyKes: p.priceOnRequest ? null : p.priceKes,
    cleaningFeeKes: p.cleaningFeeKes,
    minNights: Math.max(1, p.minNights ?? 1),
    maxGuests: p.maxGuests,
    checkInTime: p.checkInTime,
    checkOutTime: p.checkOutTime,
    blocks,
  };
}
