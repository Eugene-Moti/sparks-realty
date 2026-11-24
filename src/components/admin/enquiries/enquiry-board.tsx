"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  CalendarBlankIcon,
  DownloadSimpleIcon,
  EnvelopeSimpleIcon,
  HouseLineIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  PhoneIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RelativeTime } from "@/components/admin/relative-time";
import { PageHeader, Switch } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/helpers/classname-helper";
import { updateEnquiry } from "@/lib/admin/actions/enquiries";
import { ENQUIRY_COLUMNS, enquiryKindLabels, enquiryStatusLabels } from "@/lib/admin/labels";
import type { Option } from "@/lib/admin/queries";
import { formatShortDate } from "@/lib/dates";
import type { EnquiryKind, EnquiryRow, EnquiryStatus, ListingType } from "@/types/db";
import { EnquiryDrawer } from "./enquiry-drawer";
import { LogEnquiryDialog } from "./log-enquiry-dialog";

export type InboxEnquiry = EnquiryRow & {
  property: { id: string; title: string; ref_code: string | null; slug: string; listing_type: ListingType } | null;
};

export type BoardProps = {
  enquiries: InboxEnquiry[];
  agents: Option[];
  listings: Option[];
  me: { id: string; name: string };
  canDelete: boolean;
  initialOpen: string | null;
  initialLog: boolean;
};

/**
 * Keyboard dragging (Space, ←/→, Space): jump a card one whole column per arrow
 * press instead of dnd-kit's default 25px nudge, which never reaches a column.
 */
const columnKeyboardCoordinates: KeyboardCoordinateGetter = (event, { context: { active, collisionRect, droppableRects, droppableContainers } }) => {
  if (event.code !== "ArrowRight" && event.code !== "ArrowLeft") return undefined;
  event.preventDefault();
  if (!active || !collisionRect) return undefined;
  const dir = event.code === "ArrowRight" ? 1 : -1;
  const centre = collisionRect.left + collisionRect.width / 2;
  let best: { left: number; top: number; width: number; distance: number } | null = null;
  for (const container of droppableContainers.getEnabled()) {
    const rect = droppableRects.get(container.id);
    if (!rect) continue;
    const distance = (rect.left + rect.width / 2 - centre) * dir;
    if (distance > rect.width / 4 && (!best || distance < best.distance)) best = { left: rect.left, top: rect.top, width: rect.width, distance };
  }
  if (!best) return undefined;
  return { x: best.left + (best.width - collisionRect.width) / 2, y: best.top + 72 };
};

const COLUMN_HINTS: Record<(typeof ENQUIRY_COLUMNS)[number], string> = {
  new: "Reply within the hour",
  contacted: "Waiting on the client",
  qualified: "Viewing, offer or booking in progress",
  closed: "Won, lost or done",
};

export function EnquiryBoard({ enquiries: initial, agents, listings, me, canDelete, initialOpen, initialLog }: BoardProps) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(initialOpen);
  const [logOpen, setLogOpen] = useState(initialLog);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<EnquiryKind | "">("");
  const [owner, setOwner] = useState<"all" | "mine" | "unassigned">("all");
  const [marketingOnly, setMarketingOnly] = useState(false);
  const [showSpam, setShowSpam] = useState(false);
  const [dragging, setDragging] = useState<InboxEnquiry | null>(null);

  // Keep local edits, but accept fresh server data after router.refresh().
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) {
    setSeen(initial);
    setItems(initial);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: columnKeyboardCoordinates }),
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((e) => {
      if (!showSpam && e.status === "spam") return false;
      if (kind && e.kind !== kind) return false;
      if (marketingOnly && !e.marketing_opt_in) return false;
      if (owner === "mine" && e.assigned_to !== me.id) return false;
      if (owner === "unassigned" && e.assigned_to) return false;
      if (!needle) return true;
      return [e.full_name, e.email, e.phone, e.message, e.property?.title, e.property?.ref_code]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [items, q, kind, owner, marketingOnly, showSpam, me.id]);

  const agentName = (id: string | null) => agents.find((a) => a.value === id)?.label ?? null;
  const open = items.find((e) => e.id === openId) ?? null;

  function patchLocal(id: string, patch: Partial<InboxEnquiry>) {
    setItems((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  async function move(id: string, status: EnquiryStatus) {
    const before = items.find((e) => e.id === id);
    if (!before || before.status === status) return;
    patchLocal(id, { status });
    const result = await updateEnquiry(id, { status });
    if (!result.ok) {
      toast.error(result.error);
      patchLocal(id, { status: before.status });
    } else {
      toast.success(`${before.full_name} → ${enquiryStatusLabels[status]}`);
      router.refresh();
    }
  }

  function onDragStart(e: DragStartEvent) {
    setDragging(items.find((x) => x.id === e.active.id) ?? null);
  }
  function onDragEnd(e: DragEndEvent) {
    setDragging(null);
    if (e.over) void move(String(e.active.id), e.over.id as EnquiryStatus);
  }

  const exportHref = `/admin/enquiries/export${marketingOnly ? "?marketing=1" : ""}`;

  return (
    <>
      <PageHeader
        eyebrow="Leads"
        title="Enquiries"
        description="Drag a card to move it along. Open it to reply, assign an agent or add notes."
        actions={
          <>
            <Button asChild variant="ghost" size="sm" className="border border-border">
              <a href={exportHref} download>
                <DownloadSimpleIcon /> Export CSV
              </a>
            </Button>
            <Button variant="green-solid" size="sm" onClick={() => setLogOpen(true)}>
              <PlusIcon weight="bold" /> Log an enquiry
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 rounded-(--radius-card) border border-hairline bg-surface p-4 shadow-soft lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search enquiries</span>
          <MagnifyingGlassIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, phone, email, listing…"
            className="h-10 w-full rounded-full border border-border bg-background pr-4 pl-10 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            aria-label="Type of enquiry"
            value={kind}
            onChange={(e) => setKind(e.target.value as EnquiryKind | "")}
            placeholder="All types"
            options={(Object.keys(enquiryKindLabels) as EnquiryKind[]).map((k) => ({ value: k, label: enquiryKindLabels[k] }))}
            className="w-44 [&_select]:h-10 [&_select]:text-sm"
          />
          <Select
            aria-label="Assigned to"
            value={owner}
            onChange={(e) => setOwner(e.target.value as typeof owner)}
            options={[
              { value: "all", label: "Everyone's" },
              { value: "mine", label: "Assigned to me" },
              { value: "unassigned", label: "Unassigned" },
            ]}
            className="w-44 [&_select]:h-10 [&_select]:text-sm"
          />
          <div className="whitespace-nowrap">
            <Switch checked={marketingOnly} onCheckedChange={setMarketingOnly} label="Opted in to marketing" />
          </div>
          <div className="whitespace-nowrap">
            <Switch checked={showSpam} onCheckedChange={setShowSpam} label="Show spam" />
          </div>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {ENQUIRY_COLUMNS.map((status) => {
            const cards = filtered.filter((e) => e.status === status || (status === "closed" && e.status === "spam"));
            return (
              <Column key={status} status={status} count={cards.length}>
                {cards.length ? (
                  cards.map((e) => (
                    <DraggableCard key={e.id} enquiry={e} agent={agentName(e.assigned_to)} onOpen={() => setOpenId(e.id)} />
                  ))
                ) : (
                  <p className="rounded-2xl border border-border border-dashed p-4 text-center text-muted text-xs">Nothing here</p>
                )}
              </Column>
            );
          })}
        </div>
        <DragOverlay dropAnimation={null}>
          {dragging ? <Card enquiry={dragging} agent={agentName(dragging.assigned_to)} className="rotate-2 shadow-lift" /> : null}
        </DragOverlay>
      </DndContext>

      <EnquiryDrawer
        enquiry={open}
        agents={agents}
        me={me}
        canDelete={canDelete}
        onClose={() => setOpenId(null)}
        onPatched={(id, patch) => {
          patchLocal(id, patch);
          router.refresh();
        }}
        onDeleted={(id) => {
          setItems((l) => l.filter((e) => e.id !== id));
          setOpenId(null);
          router.refresh();
        }}
      />
      <LogEnquiryDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        agents={agents}
        listings={listings}
        onLogged={() => router.refresh()}
      />
    </>
  );
}

function Column({ status, count, children }: { status: (typeof ENQUIRY_COLUMNS)[number]; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      aria-label={`${enquiryStatusLabels[status]}: ${count}`}
      className={cn(
        "flex w-[82vw] max-w-sm shrink-0 snap-start flex-col gap-3 rounded-(--radius-card) bg-surface-2/60 p-3 transition-colors sm:w-80 lg:w-auto lg:max-w-none",
        isOver && "bg-gold-100 ring-2 ring-gold-600/50",
      )}
    >
      <header className="flex items-center justify-between px-1 pt-1">
        <div>
          <h2 className="font-display text-lg leading-tight">{enquiryStatusLabels[status]}</h2>
          <p className="text-muted text-xs">{COLUMN_HINTS[status]}</p>
        </div>
        <span className="rounded-full bg-background px-2.5 py-0.5 font-mono text-xs">{count}</span>
      </header>
      <div className="flex max-h-[70vh] flex-col gap-2.5 overflow-y-auto pr-0.5" data-lenis-prevent>
        {children}
      </div>
    </section>
  );
}

function DraggableCard({ enquiry, agent, onOpen }: { enquiry: InboxEnquiry; agent: string | null; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: enquiry.id });
  return (
    <div ref={setNodeRef} className={cn(isDragging && "opacity-30")}>
      <Card enquiry={enquiry} agent={agent} onOpen={onOpen} dragProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

function Card({
  enquiry: e,
  agent,
  onOpen,
  dragProps,
  className,
}: {
  enquiry: InboxEnquiry;
  agent: string | null;
  onOpen?: () => void;
  dragProps?: Record<string, unknown>;
  className?: string;
}) {
  const dates =
    e.check_in && e.check_out
      ? `${formatShortDate(e.check_in)} → ${formatShortDate(e.check_out)}${e.guests ? ` · ${e.guests} guests` : ""}`
      : e.preferred_date
        ? `Viewing ${formatShortDate(e.preferred_date)}`
        : null;

  return (
    <article
      {...dragProps}
      className={cn(
        "group flex cursor-grab flex-col gap-2 rounded-2xl border border-border bg-surface p-3.5 text-left shadow-soft outline-none transition-shadow hover:shadow-lift focus-visible:ring-3 focus-visible:ring-ring/30 active:cursor-grabbing",
        e.status === "new" && "border-l-4 border-l-green-600",
        e.status === "spam" && "opacity-60",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onOpen}
          onPointerDown={(ev) => ev.stopPropagation()}
          className="min-w-0 text-left font-medium hover:text-accent focus-visible:underline focus-visible:outline-none"
        >
          {e.full_name}
          {e.status === "spam" ? <span className="ml-2 text-danger text-xs">Spam</span> : null}
        </button>
        <RelativeTime iso={e.created_at} className="shrink-0 text-[0.7rem] text-muted" />
      </div>
      <p className="text-muted text-xs">{enquiryKindLabels[e.kind]}</p>
      {e.property ? (
        <p className="flex items-center gap-1.5 truncate text-xs">
          <HouseLineIcon className="size-3.5 shrink-0 text-accent" />
          <span className="truncate">{e.property.title}</span>
        </p>
      ) : null}
      {dates ? (
        <p className="flex items-center gap-1.5 text-xs">
          <CalendarBlankIcon className="size-3.5 shrink-0 text-accent" /> {dates}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[0.7rem] text-muted">
        {e.phone ? <PhoneIcon className="size-3.5" aria-label="Has phone" /> : null}
        {e.email ? <EnvelopeSimpleIcon className="size-3.5" aria-label="Has email" /> : null}
        {e.marketing_opt_in ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2 py-0.5 text-gold-800">
            <MegaphoneIcon className="size-3" /> Opted in
          </span>
        ) : null}
        {agent ? <span className="ml-auto truncate rounded-full bg-foreground/6 px-2 py-0.5">{agent}</span> : null}
      </div>
    </article>
  );
}
