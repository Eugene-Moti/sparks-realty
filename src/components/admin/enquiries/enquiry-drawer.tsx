"use client";

import {
  ArrowSquareOutIcon,
  CheckCircleIcon,
  EnvelopeSimpleIcon,
  MegaphoneIcon,
  PhoneIcon,
  ProhibitIcon,
  ShieldCheckIcon,
  TrashIcon,
  WhatsappLogoIcon,
  XIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { Pill, useConfirm } from "@/components/admin/ui";
import { useAction } from "@/components/admin/use-action";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { deleteEnquiry, updateEnquiry } from "@/lib/admin/actions/enquiries";
import { enquiryKindLabels, enquiryStatusLabels, sourceLabel } from "@/lib/admin/labels";
import type { Option } from "@/lib/admin/queries";
import { formatLongDate } from "@/lib/dates";
import { formatPhoneDisplay, telLink, whatsappLink } from "@/lib/format";
import { listingHref } from "@/lib/labels";
import type { EnquiryStatus } from "@/types/db";
import type { InboxEnquiry } from "./enquiry-board";

const stampFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Nairobi",
});

export function EnquiryDrawer({
  enquiry,
  agents,
  me,
  canDelete,
  onClose,
  onPatched,
  onDeleted,
}: {
  enquiry: InboxEnquiry | null;
  agents: Option[];
  me: { id: string; name: string };
  canDelete: boolean;
  onClose: () => void;
  onPatched: (id: string, patch: Partial<InboxEnquiry>) => void;
  onDeleted: (id: string) => void;
}) {
  return (
    <Sheet open={!!enquiry} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full max-w-xl overflow-y-auto p-0 sm:max-w-xl" hideClose data-lenis-prevent>
        {enquiry ? (
          <DrawerBody
            key={enquiry.id}
            e={enquiry}
            agents={agents}
            me={me}
            canDelete={canDelete}
            onPatched={onPatched}
            onDeleted={onDeleted}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({
  e,
  agents,
  me,
  canDelete,
  onPatched,
  onDeleted,
}: {
  e: InboxEnquiry;
  agents: Option[];
  me: { id: string; name: string };
  canDelete: boolean;
  onPatched: (id: string, patch: Partial<InboxEnquiry>) => void;
  onDeleted: (id: string) => void;
}) {
  const confirm = useConfirm();
  const { pending, run } = useAction();
  const [notes, setNotes] = useState(e.notes ?? "");
  const firstName = e.full_name.split(" ")[0];
  const about = e.property ? ` about ${e.property.title}${e.property.ref_code ? ` (${e.property.ref_code})` : ""}` : "";
  const waText = `Hi ${firstName}, this is ${me.name.split(" ")[0]} from Sparks Properties${about ? `. Thanks for your enquiry${about}` : ". Thanks for getting in touch"}.`;

  const patch = (p: { status?: EnquiryStatus; assigned_to?: string | null; notes?: string | null }, success: string) =>
    run(() => updateEnquiry(e.id, p), { success, onSuccess: () => onPatched(e.id, p) });

  async function remove() {
    const yes = await confirm({
      title: `Delete ${e.full_name}'s enquiry?`,
      description:
        "Use this for data-erasure requests under the Kenya Data Protection Act. Their details are deleted permanently and can't be recovered.",
      confirmLabel: "Delete permanently",
      destructive: true,
    });
    if (yes) await run(() => deleteEnquiry(e.id), { success: "Enquiry deleted.", onSuccess: () => onDeleted(e.id) });
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 flex flex-col gap-3 border-hairline border-b bg-surface/95 p-5 backdrop-blur sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow text-accent">{enquiryKindLabels[e.kind]}</p>
            <SheetTitle className="font-display text-3xl leading-tight">{e.full_name}</SheetTitle>
            <SheetDescription className="text-muted text-sm">Received {stampFmt.format(new Date(e.created_at))}</SheetDescription>
          </div>
          <SheetClose asChild>
            <button type="button" className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-foreground/6" aria-label="Close">
              <XIcon className="size-5" />
            </button>
          </SheetClose>
        </div>
        <div className="flex flex-wrap gap-2">
          {e.phone ? (
            <>
              <Button asChild size="sm" variant="green-solid">
                <a href={whatsappLink(waText, e.phone)} target="_blank" rel="noopener noreferrer">
                  <WhatsappLogoIcon weight="fill" /> WhatsApp
                </a>
              </Button>
              <Button asChild size="sm" variant="ghost" className="border border-border">
                <a href={telLink(e.phone)}>
                  <PhoneIcon /> Call
                </a>
              </Button>
            </>
          ) : null}
          {e.email ? (
            <Button asChild size="sm" variant="ghost" className="border border-border">
              <a href={`mailto:${e.email}?subject=${encodeURIComponent(`Your Sparks Properties enquiry${about}`)}`}>
                <EnvelopeSimpleIcon /> Email
              </a>
            </Button>
          ) : null}
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Stage</span>
            <Select
              value={e.status}
              disabled={pending}
              onChange={(ev) => patch({ status: ev.target.value as EnquiryStatus }, `Moved to ${enquiryStatusLabels[ev.target.value as EnquiryStatus]}.`)}
              options={(["new", "contacted", "qualified", "closed", "spam"] as EnquiryStatus[]).map((s) => ({ value: s, label: enquiryStatusLabels[s] }))}
              className="[&_select]:h-11 [&_select]:text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Assigned to</span>
            <Select
              value={e.assigned_to ?? ""}
              disabled={pending}
              onChange={(ev) => patch({ assigned_to: ev.target.value || null }, "Assignment saved.")}
              placeholder="Nobody yet"
              options={agents}
              className="[&_select]:h-11 [&_select]:text-sm"
            />
          </label>
        </div>

        <dl className="grid gap-x-6 gap-y-4 rounded-2xl border border-border p-4 text-sm sm:grid-cols-2">
          <Item label="Phone">{e.phone ? <a href={telLink(e.phone)} className="font-mono hover:text-accent">{formatPhoneDisplay(e.phone)}</a> : "—"}</Item>
          <Item label="Email">{e.email ? <a href={`mailto:${e.email}`} className="break-all hover:text-accent">{e.email}</a> : "—"}</Item>
          {e.property ? (
            <Item label="Listing" wide>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Link href={`/admin/properties/${e.property.id}`} className="font-medium hover:text-accent">
                  {e.property.title}
                </Link>
                <a href={listingHref(e.property.listing_type, e.property.slug)} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-muted text-xs hover:text-foreground">
                  {e.property.ref_code} <ArrowSquareOutIcon />
                </a>
              </span>
            </Item>
          ) : null}
          {e.preferred_date ? <Item label="Preferred viewing">{`${formatLongDate(e.preferred_date)}${e.preferred_time ? ` · ${e.preferred_time}` : ""}`}</Item> : null}
          {e.check_in && e.check_out ? (
            <Item label="Stay">{`${formatLongDate(e.check_in)} → ${formatLongDate(e.check_out)}${e.guests ? ` · ${e.guests} guests` : ""}`}</Item>
          ) : null}
          {e.country ? <Item label="Country">{e.country}</Item> : null}
          <Item label="Source">{sourceLabel(e.source)}</Item>
        </dl>

        {e.message ? (
          <section className="flex flex-col gap-2">
            <h3 className="eyebrow text-muted">Message</h3>
            <p className="whitespace-pre-wrap rounded-2xl bg-surface-2/60 p-4 text-sm leading-relaxed">{e.message}</p>
          </section>
        ) : null}

        <section className="flex flex-col gap-2" aria-label="Consent">
          <h3 className="eyebrow text-muted">Consent (Data Protection Act)</h3>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {e.consent_given ? (
              <Pill tone="green">
                <ShieldCheckIcon /> Consent given
              </Pill>
            ) : (
              <Pill tone="danger">No consent recorded</Pill>
            )}
            {e.consent_at ? <span className="text-muted text-xs">{stampFmt.format(new Date(e.consent_at))}</span> : null}
            {e.marketing_opt_in ? (
              <Pill tone="gold">
                <MegaphoneIcon /> Marketing opt-in
              </Pill>
            ) : (
              <span className="text-muted text-xs">No marketing — don&apos;t add to newsletters.</span>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <label htmlFor={`notes-${e.id}`} className="eyebrow text-muted">
            Team notes
          </label>
          <Textarea
            id={`notes-${e.id}`}
            rows={4}
            value={notes}
            onChange={(ev) => setNotes(ev.target.value)}
            placeholder="e.g. Called Tue — wants 3 beds near ISK, budget 180k. Viewing Sat 10am."
            className="text-sm"
          />
          <Button
            size="sm"
            variant="solid"
            className="self-end"
            disabled={pending || notes === (e.notes ?? "")}
            onClick={() => patch({ notes }, "Notes saved.")}
          >
            <CheckCircleIcon /> Save notes
          </Button>
        </section>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-hairline border-t p-5 sm:p-6">
        {e.status !== "spam" ? (
          <Button size="sm" variant="ghost" onClick={() => patch({ status: "spam" }, "Marked as spam.")} disabled={pending}>
            <ProhibitIcon /> Mark as spam
          </Button>
        ) : (
          <span />
        )}
        {canDelete ? (
          <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/8" onClick={() => void remove()} disabled={pending}>
            <TrashIcon /> Delete (erasure request)
          </Button>
        ) : null}
      </footer>
    </div>
  );
}

function Item({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
