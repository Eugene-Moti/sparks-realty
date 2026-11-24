"use server";

import { headers } from "next/headers";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Count a listing view. The client calls this once per browser session per
 * listing; the RPC only touches published listings and needs no UPDATE grant.
 */
export async function recordPropertyView(slug: unknown): Promise<void> {
  if (typeof slug !== "string" || !/^[a-z0-9-]{1,160}$/.test(slug) || !hasSupabaseEnv()) return;
  const ip = clientIp(await headers());
  if (!rateLimit(`view:${ip}:${slug}`, { limit: 3, windowMs: 60 * 60_000 }).ok) return;
  if (!rateLimit(`views:${ip}`, { limit: 120, windowMs: 60 * 60_000 }).ok) return;

  const { error } = await createPublicClient().rpc("increment_property_view", { p_slug: slug });
  if (error) console.error("[recordPropertyView]", error.message);
}
