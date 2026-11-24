"use client";

import {
  ArchiveIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CopyIcon,
  DotsThreeIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  RocketLaunchIcon,
  StarIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import type React from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RelativeTime } from "@/components/admin/relative-time";
import { EmptyState, Pill, useConfirm } from "@/components/admin/ui";
import { useAction } from "@/components/admin/use-action";
import { Button } from "@/components/ui/button";
import { Chip, ToggleGroup } from "@/components/ui/toggle-group";
import { cn } from "@/helpers/classname-helper";
import { bulkSetStatus, duplicateProperty } from "@/lib/admin/actions/properties";
import { listingStatusLabels, listingStatusTones } from "@/lib/admin/labels";
import { formatPrice } from "@/lib/format";
import { listingTypeLabels } from "@/lib/labels";
import type { ListingStatus, ListingType } from "@/types/db";

export type ListingRow = {
  id: string;
  title: string;
  ref_code: string | null;
  slug: string;
  listing_type: ListingType;
  status: ListingStatus;
  price_kes: number | string | null;
  price_on_request: boolean;
  is_featured: boolean;
  view_count: number;
  updated_at: string;
  area: string | null;
  cover: string | null;
  photos: number;
};

type StatusFilter = ListingStatus | "active" | "all";

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, datetime: sortFn_datetime },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  rowSelectionFeature,
});

const helper = createColumnHelper<typeof features, ListingRow>();

const periodFor = (t: ListingType) => (t === "sale" ? "once" : t === "rent" ? "month" : "night");

const columns = helper.columns([
  helper.display({
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        aria-label="Select all listings shown"
        className="size-4 accent-green-600"
        checked={table.getIsAllRowsSelected()}
        ref={(el) => {
          if (el) el.indeterminate = table.getIsSomeRowsSelected();
        }}
        onChange={() => table.toggleAllRowsSelected()}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        aria-label={`Select ${row.original.title}`}
        className="size-4 accent-green-600"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  }),
  helper.accessor((r) => `${r.title} ${r.ref_code ?? ""} ${r.area ?? ""}`, {
    id: "listing",
    header: "Listing",
    sortFn: (a, b) => a.original.title.localeCompare(b.original.title),
    cell: ({ row }) => {
      const r = row.original;
      return (
        <Link href={`/admin/properties/${r.id}`} className="group flex min-w-64 items-center gap-3">
          <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
            {r.cover ? <Image src={r.cover} alt="" fill sizes="64px" className="object-cover" /> : null}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 font-medium group-hover:text-accent">
              <span className="line-clamp-1">{r.title}</span>
              {r.is_featured ? <StarIcon weight="fill" className="size-3.5 shrink-0 text-gold-600" aria-label="Featured" /> : null}
            </span>
            <span className="block text-muted text-xs">
              <span className="font-mono">{r.ref_code ?? "—"}</span>
              {r.area ? ` · ${r.area}` : ""}
            </span>
          </span>
        </Link>
      );
    },
  }),
  helper.accessor("listing_type", {
    header: "Type",
    cell: ({ getValue }) => <span className="whitespace-nowrap text-sm">{listingTypeLabels[getValue()]}</span>,
  }),
  helper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => <Pill tone={listingStatusTones[getValue()]}>{listingStatusLabels[getValue()]}</Pill>,
  }),
  helper.accessor((r) => Number(r.price_kes) || 0, {
    id: "price",
    header: "Price",
    cell: ({ row }) => {
      const r = row.original;
      const p = formatPrice({ priceKes: r.price_kes, period: periodFor(r.listing_type), priceOnRequest: r.price_on_request });
      return <span className="whitespace-nowrap font-mono text-sm">{p.primary}</span>;
    },
  }),
  helper.accessor("photos", {
    header: "Photos",
    cell: ({ getValue }) => (
      <span className={cn("font-mono text-sm", getValue() === 0 && "text-danger")}>{getValue() === 0 ? "None" : getValue()}</span>
    ),
  }),
  helper.accessor("view_count", {
    header: "Views",
    cell: ({ getValue }) => <span className="font-mono text-muted text-sm">{getValue().toLocaleString("en-KE")}</span>,
  }),
  helper.accessor("updated_at", {
    header: "Updated",
    sortFn: "datetime",
    cell: ({ getValue }) => <RelativeTime iso={getValue()} className="whitespace-nowrap text-muted text-xs" />,
  }),
  helper.display({ id: "actions", header: () => <span className="sr-only">Actions</span>, cell: ({ row }) => <RowActions row={row.original} /> }),
]);

const TYPE_FILTERS: { value: ListingType | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "sale", label: "For sale" },
  { value: "rent", label: "To rent" },
  { value: "short_stay", label: "Short stays" },
];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Drafts" },
  { value: "published", label: "Published" },
  { value: "under_offer", label: "Under offer" },
  { value: "sold", label: "Sold" },
  { value: "let", label: "Let" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "Everything" },
];

export function PropertiesTable({
  rows,
  initialType,
  initialStatus,
}: {
  rows: ListingRow[];
  initialType: ListingType | "all";
  initialStatus: StatusFilter;
  canDelete: boolean;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const { pending, run } = useAction();
  const [type, setType] = useState<ListingType | "all">(initialType);
  const [status, setStatus] = useState<StatusFilter>(initialStatus);

  const data = useMemo(
    () =>
      rows.filter(
        (r) =>
          (type === "all" || r.listing_type === type) &&
          (status === "all" || (status === "active" ? r.status !== "archived" : r.status === status)),
      ),
    [rows, type, status],
  );

  const table = useTable({
    features,
    columns,
    data,
    getRowId: (r) => r.id,
    globalFilterFn: "includesString",
    getColumnCanGlobalFilter: (column) => column.id === "listing",
    initialState: { sorting: [{ id: "updated_at", desc: true }] },
  });

  const selected = table.getSelectedRowModel().rows.map((r) => r.original);
  const visibleRows = table.getRowModel().rows;

  async function bulk(next: "published" | "archived" | "draft") {
    const verb = next === "published" ? "Publish" : next === "archived" ? "Archive" : "Unpublish";
    const yes = await confirm({
      title: `${verb} ${selected.length} listing${selected.length === 1 ? "" : "s"}?`,
      description:
        next === "published"
          ? "They'll appear on the website straight away. Listings missing an area, price or photo are skipped."
          : next === "archived"
            ? "They'll be hidden from the website. You can restore them any time."
            : "They'll go back to drafts and disappear from the website.",
      confirmLabel: verb,
      destructive: next === "archived",
    });
    if (!yes) return;
    await run(() => bulkSetStatus({ ids: selected.map((r) => r.id), status: next }), {
      onSuccess: ({ changed, skipped }) => {
        toast.success(`${verb}ed ${changed} listing${changed === 1 ? "" : "s"}.`);
        if (skipped.length) toast.warning(`Not published (missing area, price or photo): ${skipped.join(", ")}`);
        table.resetRowSelection();
        router.refresh();
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative w-full lg:max-w-sm">
          <span className="sr-only">Search listings</span>
          <MagnifyingGlassIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={table.state.globalFilter ?? ""}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            placeholder="Search title, ref or area…"
            className="h-11 w-full rounded-full border border-border bg-surface pr-4 pl-10 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
          />
        </label>
        <ToggleGroup type="single" value={type} onValueChange={(v) => v && setType(v as ListingType | "all")} aria-label="Listing type">
          {TYPE_FILTERS.map((f) => (
            <Chip key={f.value} value={f.value} className="h-9 text-sm">
              {f.label}
            </Chip>
          ))}
        </ToggleGroup>
      </div>
      <ToggleGroup
        type="single"
        value={status}
        onValueChange={(v) => v && setStatus(v as StatusFilter)}
        aria-label="Status"
        className="-mx-1 flex-nowrap overflow-x-auto px-1 pb-1 scrollbar-none"
      >
        {STATUS_FILTERS.map((f) => (
          <Chip key={f.value} value={f.value} className="h-8 shrink-0 text-xs">
            {f.label}
            <span className="font-mono opacity-60">
              {f.value === "all"
                ? rows.length
                : f.value === "active"
                  ? rows.filter((r) => r.status !== "archived").length
                  : rows.filter((r) => r.status === f.value).length}
            </span>
          </Chip>
        ))}
      </ToggleGroup>

      {selected.length ? (
        <div
          role="region"
          aria-label="Bulk actions"
          className="sticky top-16 z-20 flex flex-wrap items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-ivory shadow-lift lg:top-4"
        >
          <span className="mr-2 text-sm">
            <strong className="font-mono">{selected.length}</strong> selected
          </span>
          <Button size="sm" variant="green-solid" disabled={pending} onClick={() => bulk("published")}>
            <RocketLaunchIcon /> Publish
          </Button>
          <Button size="sm" variant="ghost" className="text-ivory hover:bg-ivory/10" disabled={pending} onClick={() => bulk("draft")}>
            Unpublish
          </Button>
          <Button size="sm" variant="ghost" className="text-ivory hover:bg-ivory/10" disabled={pending} onClick={() => bulk("archived")}>
            <ArchiveIcon /> Archive
          </Button>
          <button
            type="button"
            onClick={() => table.resetRowSelection()}
            className="ml-auto grid size-8 place-items-center rounded-full hover:bg-ivory/10"
            aria-label="Clear selection"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No listings yet"
          action={
            <Button asChild variant="green-solid">
              <Link href="/admin/properties/new">Add your first listing</Link>
            </Button>
          }
        >
          Start with the basics — you can save a draft and add photos later.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-(--radius-card) border border-hairline bg-surface shadow-soft">
          <table className="w-full border-collapse text-left">
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id} className="border-hairline border-b">
                  {group.headers.map((header) => {
                    const sortable = header.column.getCanSort() && header.id !== "select" && header.id !== "actions";
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                        className={cn("px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider", header.id === "select" && "w-10")}
                      >
                        {header.isPlaceholder ? null : sortable ? (
                          <button type="button" onClick={header.column.getToggleSortingHandler()} className="inline-flex items-center gap-1 uppercase hover:text-foreground">
                            <table.FlexRender header={header} />
                            {sorted === "asc" ? <ArrowUpIcon className="size-3" /> : sorted === "desc" ? <ArrowDownIcon className="size-3" /> : null}
                          </button>
                        ) : (
                          <table.FlexRender header={header} />
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr
                  key={row.id}
                  className={cn("border-hairline border-b transition-colors last:border-0 hover:bg-foreground/[0.025]", row.getIsSelected() && "bg-gold-100/40")}
                >
                  {row.getAllCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {visibleRows.length === 0 ? <p className="p-8 text-center text-muted text-sm">No listings match these filters.</p> : null}
        </div>
      )}
      <p className="text-muted text-xs" aria-live="polite">
        Showing {visibleRows.length} of {rows.length} listings.
      </p>
    </div>
  );
}

function RowActions({ row }: { row: ListingRow }) {
  const router = useRouter();
  const { run } = useAction();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="grid size-9 place-items-center rounded-full hover:bg-foreground/8" aria-label={`Actions for ${row.title}`}>
          <DotsThreeIcon weight="bold" className="size-5" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-48 rounded-2xl border border-hairline bg-surface p-1.5 text-foreground text-sm shadow-lift data-[state=open]:animate-fade-in"
        >
          <MenuItem onSelect={() => router.push(`/admin/properties/${row.id}`)} icon={<PencilSimpleIcon />}>
            Edit
          </MenuItem>
          <MenuItem onSelect={() => window.open(`/preview/${row.id}`, "_blank", "noopener")} icon={<EyeIcon />}>
            Preview
          </MenuItem>
          <MenuItem
            onSelect={() =>
              run(() => duplicateProperty(row.id), {
                success: "Copied as a new draft.",
                onSuccess: ({ id }) => router.push(`/admin/properties/${id}`),
              })
            }
            icon={<CopyIcon />}
          >
            Duplicate
          </MenuItem>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function MenuItem({ children, icon, onSelect }: { children: React.ReactNode; icon: React.ReactNode; onSelect: () => void }) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 outline-none data-highlighted:bg-foreground/6 [&_svg]:size-4 [&_svg]:text-muted"
    >
      {icon}
      {children}
    </DropdownMenu.Item>
  );
}
