import {
  ArrowRightIcon,
  ChartLineUpIcon,
  NewspaperIcon,
  PhoneCallIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import type React from "react";
import Link from "next/link";
import { RelativeTime } from "@/components/admin/relative-time";
import { EmptyState, PageHeader, Panel, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/admin/auth";
import { enquiryKindLabels, enquiryStatusLabels, enquiryStatusTones, sourceLabel } from "@/lib/admin/labels";
import { can } from "@/lib/admin/roles";
import { isoDaysAgo } from "@/lib/dates";
import { listingTypeLabels } from "@/lib/labels";
import type { EnquiryKind, EnquiryStatus, ListingType } from "@/types/db";

export const metadata: Metadata = { title: "Dashboard" };

const num = new Intl.NumberFormat("en-KE");

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { staff, supabase } = await requireStaff();
  const { denied } = await searchParams;
  const leads = can.manageLeads(staff.role);
  const weekAgo = isoDaysAgo(7);
  const monthAgo = isoDaysAgo(30);

  const [listings, top, weekly, bySource, recent] = await Promise.all([
    supabase.from("properties").select("listing_type, status"),
    supabase
      .from("properties")
      .select("id, title, ref_code, view_count, listing_type")
      .in("status", ["published", "under_offer"])
      .order("view_count", { ascending: false })
      .limit(5),
    leads ? supabase.from("enquiries").select("id", { count: "exact", head: true }).gte("created_at", weekAgo) : null,
    leads ? supabase.from("enquiries").select("source").gte("created_at", monthAgo).limit(2000) : null,
    leads
      ? supabase
          .from("enquiries")
          .select("id, full_name, kind, status, created_at, property:properties(title)")
          .order("created_at", { ascending: false })
          .limit(6)
      : null,
  ]);

  const rows = (listings.data ?? []) as { listing_type: ListingType; status: string }[];
  const published = (t: ListingType) => rows.filter((r) => r.listing_type === t && r.status === "published").length;
  const drafts = rows.filter((r) => r.status === "draft").length;

  const sourceCounts = new Map<string, number>();
  for (const r of (bySource?.data ?? []) as { source: string | null }[]) {
    const label = sourceLabel(r.source);
    sourceCounts.set(label, (sourceCounts.get(label) ?? 0) + 1);
  }
  const sources = [...sourceCounts.entries()].sort((a, b) => b[1] - a[1]);
  const topSources = sources.length > 6 ? [...sources.slice(0, 5), ["Other", sources.slice(5).reduce((s, [, n]) => s + n, 0)] as const] : sources;
  const maxSource = Math.max(1, ...topSources.map(([, n]) => n));

  const recentRows = (recent?.data ?? []) as unknown as {
    id: string;
    full_name: string;
    kind: EnquiryKind;
    status: EnquiryStatus;
    created_at: string;
    property: { title: string } | null;
  }[];

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`Hello${staff.fullName ? `, ${staff.fullName.split(" ")[0]}` : ""}`}
        description="What's live on the website and what needs a reply."
        actions={
          <Button asChild variant="green-solid">
            <Link href="/admin/properties/new">
              <PlusIcon weight="bold" /> New listing
            </Link>
          </Button>
        }
      />

      {denied ? (
        <p role="alert" className="rounded-2xl border border-danger/30 bg-danger/8 p-4 text-sm">
          That page is for other roles. Ask an admin if you need access.
        </p>
      ) : null}

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={`${listingTypeLabels.sale} — live`} value={published("sale")} href="/admin/properties?type=sale" />
        <Stat label={`${listingTypeLabels.rent} — live`} value={published("rent")} href="/admin/properties?type=rent" />
        <Stat label={`${listingTypeLabels.short_stay} — live`} value={published("short_stay")} href="/admin/properties?type=short_stay" />
        {leads ? (
          <Stat label="New enquiries this week" value={weekly?.count ?? 0} href="/admin/enquiries" accent />
        ) : (
          <Stat label="Drafts in progress" value={drafts} href="/admin/properties?status=draft" />
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {leads ? (
          <Panel
            title="Recent enquiries"
            actions={
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/enquiries">
                  Open inbox <ArrowRightIcon />
                </Link>
              </Button>
            }
          >
            {recentRows.length ? (
              <ul className="-mx-2 flex flex-col">
                {recentRows.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/admin/enquiries?open=${e.id}`}
                      className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-foreground/4"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink font-display text-gold">
                        {e.full_name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-sm">{e.full_name}</span>
                        <span className="block truncate text-muted text-xs">
                          {enquiryKindLabels[e.kind]}
                          {e.property ? ` · ${e.property.title}` : ""}
                        </span>
                      </span>
                      <span className="flex flex-col items-end gap-1">
                        <Pill tone={enquiryStatusTones[e.status]}>{enquiryStatusLabels[e.status]}</Pill>
                        <RelativeTime iso={e.created_at} className="text-[0.7rem] text-muted" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No enquiries yet">New viewing requests, bookings and questions from the website appear here.</EmptyState>
            )}
          </Panel>
        ) : null}

        <div className="flex flex-col gap-6">
          {leads ? (
            <Panel title="Where enquiries come from" description="Last 30 days">
              {topSources.length ? (
                <ul className="flex flex-col gap-3" aria-label="Enquiries by source, last 30 days">
                  {topSources.map(([label, n]) => (
                    <li key={label} className="flex flex-col gap-1.5" title={`${label}: ${n}`}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate">{label}</span>
                        <span className="font-mono text-foreground/80 tabular-nums">{num.format(n)}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-foreground/6">
                        <div className="h-full rounded-full bg-green-600" style={{ width: `${Math.max(2, (n / maxSource) * 100)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted text-sm">No enquiries in the last 30 days.</p>
              )}
            </Panel>
          ) : null}

          <Panel title="Most viewed listings" description="All-time page views">
            {(top.data ?? []).length ? (
              <ol className="flex flex-col gap-2">
                {(top.data as { id: string; title: string; ref_code: string | null; view_count: number }[]).map((p, i) => (
                  <li key={p.id}>
                    <Link href={`/admin/properties/${p.id}`} className="flex items-center gap-3 rounded-xl py-1.5 text-sm hover:text-accent">
                      <span className="w-5 font-mono text-muted text-xs">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate">{p.title}</span>
                      <span className="flex items-center gap-1 font-mono text-muted text-xs tabular-nums">
                        <ChartLineUpIcon aria-hidden="true" /> {num.format(p.view_count)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted text-sm">Views appear once listings are published.</p>
            )}
          </Panel>

          <Panel title="Quick actions">
            <div className="grid gap-2 sm:grid-cols-2">
              <QuickAction href="/admin/properties/new" icon={<PlusIcon />} label="Add a listing" />
              {leads ? <QuickAction href="/admin/enquiries?log=1" icon={<PhoneCallIcon />} label="Log a phone enquiry" /> : null}
              <QuickAction href="/admin/posts/new" icon={<NewspaperIcon />} label="Write an insight" />
              {can.editSettings(staff.role) ? <QuickAction href="/admin/settings#stats" icon={<ChartLineUpIcon />} label="Update homepage stats" /> : null}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, href, accent }: { label: string; value: number; href: string; accent?: boolean }) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-(--radius-card) border border-hairline bg-surface p-5 shadow-soft transition-shadow hover:shadow-lift"
    >
      <span className="text-muted text-xs">{label}</span>
      <span className="flex items-end justify-between gap-2">
        <span className="font-display text-4xl leading-none tabular-nums">{num.format(value)}</span>
        {accent && value > 0 ? <span aria-hidden="true" className="mb-1 size-2 rounded-full bg-green-600" /> : null}
      </span>
    </Link>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm transition-colors hover:border-gold-600/50 hover:bg-gold-100/40 [&_svg]:size-4.5 [&_svg]:text-accent"
    >
      {icon}
      {label}
    </Link>
  );
}
