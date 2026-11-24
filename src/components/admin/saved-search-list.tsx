"use client";

import { ArrowSquareOutIcon, MagnifyingGlassIcon, MegaphoneIcon, TrashIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { RelativeTime } from "@/components/admin/relative-time";
import { EmptyState, Pill, Switch, useConfirm } from "@/components/admin/ui";
import { useAction } from "@/components/admin/use-action";
import { deleteSavedSearch } from "@/lib/admin/actions/enquiries";

export type SavedSearchItem = {
  id: string;
  email: string;
  filters: { kind?: string; path?: string; query?: string; [key: string]: unknown };
  consent_given: boolean;
  marketing_opt_in: boolean;
  consent_at: string | null;
  created_at: string;
};

function describe(f: SavedSearchItem["filters"]): string {
  if (f.kind === "newsletter") return "Newsletter";
  const parts: string[] = [];
  const listing = f.listing ?? (f.path?.includes("rent") ? "rent" : f.path?.includes("short") ? "short_stay" : f.path?.includes("buy") ? "sale" : null);
  if (listing) parts.push(listing === "sale" ? "To buy" : listing === "rent" ? "To rent" : "Short stays");
  const area = f.area as string[] | undefined;
  if (area?.length) parts.push(area.join(", "));
  if (f.beds) parts.push(`${f.beds}+ beds`);
  if (f.maxPrice) parts.push(`up to KES ${Number(f.maxPrice).toLocaleString("en-KE")}`);
  const type = f.type as string[] | undefined;
  if (type?.length) parts.push(type.join(", "));
  return parts.join(" · ") || "Any home";
}

export function SavedSearchList({ items: initial }: { items: SavedSearchItem[] }) {
  const confirm = useConfirm();
  const { pending, run } = useAction();
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState("");
  const [marketingOnly, setMarketingOnly] = useState(false);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((i) => (!marketingOnly || i.marketing_opt_in) && (!needle || i.email.toLowerCase().includes(needle)));
  }, [items, q, marketingOnly]);

  async function remove(item: SavedSearchItem) {
    const yes = await confirm({
      title: `Delete ${item.email}?`,
      description: "Use this when someone unsubscribes or asks for their data to be erased. It can't be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!yes) return;
    await run(() => deleteSavedSearch(item.id), {
      success: "Deleted.",
      onSuccess: () => setItems((l) => l.filter((x) => x.id !== item.id)),
    });
  }

  if (!items.length) {
    return <EmptyState title="No saved searches yet">When visitors tap “Save search” or subscribe to news, they appear here.</EmptyState>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative w-full sm:max-w-sm">
          <span className="sr-only">Search by email</span>
          <MagnifyingGlassIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by email…"
            className="h-10 w-full rounded-full border border-border bg-surface pr-4 pl-10 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
          />
        </label>
        <div className="w-60">
          <Switch checked={marketingOnly} onCheckedChange={setMarketingOnly} label="Opted in to marketing only" />
        </div>
      </div>
      <div className="overflow-x-auto rounded-(--radius-card) border border-hairline bg-surface shadow-soft">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-hairline border-b text-muted text-xs uppercase tracking-wider">
              <th scope="col" className="px-4 py-3 font-medium">Email</th>
              <th scope="col" className="px-4 py-3 font-medium">Looking for</th>
              <th scope="col" className="px-4 py-3 font-medium">Consent</th>
              <th scope="col" className="px-4 py-3 font-medium">Saved</th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((i) => (
              <tr key={i.id} className="border-hairline border-b last:border-0">
                <td className="px-4 py-3 font-medium">
                  <a href={`mailto:${i.email}`} className="hover:text-accent">
                    {i.email}
                  </a>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2">
                    {describe(i.filters)}
                    {i.filters.path ? (
                      <a
                        href={`${i.filters.path}${i.filters.query ? `?${i.filters.query}` : ""}`}
                        target="_blank"
                        rel="noopener"
                        className="text-muted hover:text-foreground"
                        aria-label="Open this search on the website"
                      >
                        <ArrowSquareOutIcon />
                      </a>
                    ) : null}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap gap-1.5">
                    {i.consent_given ? <Pill tone="green">Consent</Pill> : <Pill tone="danger">None</Pill>}
                    {i.marketing_opt_in ? (
                      <Pill tone="gold">
                        <MegaphoneIcon /> Marketing
                      </Pill>
                    ) : null}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <RelativeTime iso={i.created_at} className="whitespace-nowrap text-muted text-xs" />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void remove(i)}
                    className="grid size-8 place-items-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
                    aria-label={`Delete ${i.email}`}
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-muted text-xs">{visible.length} shown</p>
    </div>
  );
}
