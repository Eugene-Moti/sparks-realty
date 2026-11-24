"use client";

import { ArrowSquareOutIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SortableList } from "@/components/admin/sortable-list";
import { EmptyState, Pill } from "@/components/admin/ui";
import { reorderRows } from "@/lib/admin/actions/content";

export type AreaItem = {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  heroImage: string | null;
  hasGuide: boolean;
  listings: number;
};

export function AreaList({ items: initial }: { items: AreaItem[] }) {
  const [items, setItems] = useState(initial);
  if (!items.length) return <EmptyState title="No areas yet">Add the neighbourhoods you work in.</EmptyState>;

  return (
    <SortableList
      label="Areas"
      items={items}
      setItems={setItems}
      onReorder={(ids) => reorderRows("areas", ids)}
      renderItem={(a) => (
        <div className="flex items-center gap-4">
          <div className="relative hidden h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:block">
            {a.heroImage ? <Image src={a.heroImage} alt="" fill sizes="80px" className="object-cover" /> : null}
          </div>
          <div className="min-w-0 flex-1">
            <Link href={`/admin/areas/${a.id}`} className="font-display text-lg hover:text-accent">
              {a.name}
            </Link>
            <p className="truncate text-muted text-sm">{a.summary ?? "No summary yet"}</p>
          </div>
          <div className="hidden flex-wrap items-center gap-2 md:flex">
            <Pill tone={a.hasGuide ? "green" : "muted"}>{a.hasGuide ? "Guide written" : "No guide"}</Pill>
            <Pill>{a.listings} live</Pill>
          </div>
          <a
            href={`/areas/${a.slug}`}
            target="_blank"
            rel="noopener"
            className="grid size-9 place-items-center rounded-full text-muted hover:bg-foreground/6 hover:text-foreground"
            aria-label={`View ${a.name} on the website`}
          >
            <ArrowSquareOutIcon />
          </a>
          <Link
            href={`/admin/areas/${a.id}`}
            className="grid size-9 place-items-center rounded-full text-muted hover:bg-foreground/6 hover:text-foreground"
            aria-label={`Edit ${a.name}`}
          >
            <PencilSimpleIcon />
          </Link>
        </div>
      )}
    />
  );
}
