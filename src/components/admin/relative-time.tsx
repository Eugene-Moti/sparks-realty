"use client";

import { useSyncExternalStore } from "react";
import { timeAgo } from "@/lib/admin/labels";

const noop = () => () => {};
const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Nairobi",
});

/** "3 hours ago" in the browser (exact Nairobi time on hover); a fixed date during SSR. */
export function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  const label = useSyncExternalStore(noop, () => timeAgo(iso), () => dateFmt.format(new Date(iso)));
  return (
    <time dateTime={iso} title={dateFmt.format(new Date(iso))} className={className}>
      {label}
    </time>
  );
}
