"use client";

import { CalendarXIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { AmountField, FormSection, TextAreaField, TextField } from "@/components/admin/form-fields";
import { Pill, useConfirm } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useMediaQuery } from "@/hooks/use-media-query";
import { type AdminBlock, addStayBlock, deleteStayBlock } from "@/lib/admin/actions/properties";
import { addDays, daysBetween, formatShortWeekdayDate, fromIsoDate, nairobiToday, toIsoDate } from "@/lib/dates";
import { blockFromRow, closedNights, seasonalNights } from "@/lib/short-stay/stay";
import type { EditorValues } from "./editor-types";

const REASONS = [
  { value: "booked", label: "Booked (guest)" },
  { value: "owner", label: "Owner using it" },
  { value: "maintenance", label: "Maintenance" },
  { value: "pricing", label: "Seasonal price (stays open)" },
] as const;
type Reason = (typeof REASONS)[number]["value"];

const reasonLabel = (r: string | null) => REASONS.find((x) => x.value === r)?.label ?? "Booked";
const kes = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 });

export function StayTab({ listingId, blocks }: { listingId: string | null; blocks: AdminBlock[] }) {
  return (
    <div className="flex flex-col gap-6">
      <FormSection title="Stay details" description="Shown in “Things to know” and used by the booking widget.">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          <TextField<EditorValues> name="max_guests" label="Max guests" inputMode="numeric" required />
          <TextField<EditorValues> name="min_nights" label="Minimum nights" inputMode="numeric" placeholder="1" />
          <AmountField<EditorValues> name="cleaning_fee_kes" label="Cleaning fee (per stay)" />
          <TextField<EditorValues> name="check_in_time" label="Check-in from" type="time" />
          <TextField<EditorValues> name="check_out_time" label="Check-out by" type="time" />
        </div>
        <TextAreaField<EditorValues>
          name="house_rules_md"
          label="House rules"
          rows={5}
          placeholder={"- No smoking indoors\n- No parties or events\n- Quiet hours 22:00–07:00"}
          hint="One rule per line, starting with “- ”."
        />
      </FormSection>
      {listingId ? (
        <BlockManager listingId={listingId} initial={blocks} />
      ) : (
        <FormSection title="Calendar" description="Block booked dates once the listing is saved.">
          <p className="text-muted text-sm">Save the listing first.</p>
        </FormSection>
      )}
    </div>
  );
}

function BlockManager({ listingId, initial }: { listingId: string; initial: AdminBlock[] }) {
  const confirm = useConfirm();
  const twoMonths = useMediaQuery("(min-width: 900px)");
  const [blocks, setBlocks] = useState(initial);
  const [range, setRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });
  const [reason, setReason] = useState<Reason>("booked");
  const [rate, setRate] = useState("");
  const [busy, setBusy] = useState(false);
  const today = nairobiToday();
  const horizon = addDays(today, 400);

  const stayBlocks = useMemo(
    () => blocks.map((b) => blockFromRow({ starts_on: b.starts_on, ends_on: b.ends_on, reason: b.reason, nightly_override_kes: b.nightly_override_kes })),
    [blocks],
  );
  const closed = useMemo(() => closedNights(stayBlocks, addDays(today, -30), horizon), [stayBlocks, today, horizon]);
  const seasonal = useMemo(() => seasonalNights(stayBlocks, addDays(today, -30), horizon), [stayBlocks, today, horizon]);

  function onSelect(_: DateRange | undefined, day: Date) {
    const iso = toIsoDate(day);
    if (!range.from || range.to || iso <= range.from) setRange({ from: iso, to: null });
    else setRange({ from: range.from, to: iso });
  }

  async function add() {
    if (!range.from || !range.to) return toast.error("Pick the first night, then the check-out day.");
    setBusy(true);
    const result = await addStayBlock(listingId, {
      starts_on: range.from,
      ends_on: range.to,
      reason,
      nightly_override_kes: reason === "pricing" ? Number(rate.replace(/[,\s]/g, "")) || null : null,
    });
    setBusy(false);
    if (!result.ok) return toast.error(result.fieldErrors ? Object.values(result.fieldErrors)[0]?.[0] ?? result.error : result.error);
    setBlocks((b) => [...b, result.data].sort((a, c) => a.starts_on.localeCompare(c.starts_on)));
    setRange({ from: null, to: null });
    setRate("");
    toast.success(reason === "pricing" ? "Seasonal price added." : "Dates blocked. The website updates within a minute.");
  }

  async function remove(b: AdminBlock) {
    const yes = await confirm({
      title: b.reason === "pricing" ? "Remove this seasonal price?" : "Reopen these dates?",
      description: `${formatShortWeekdayDate(b.starts_on)} → ${formatShortWeekdayDate(b.ends_on)}`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!yes) return;
    const before = blocks;
    setBlocks((x) => x.filter((y) => y.id !== b.id));
    const result = await deleteStayBlock(listingId, b.id);
    if (!result.ok) {
      toast.error(result.error);
      setBlocks(before);
    }
  }

  const upcoming = blocks.filter((b) => b.ends_on >= today);
  const nights = range.from && range.to ? daysBetween(range.from, range.to) : 0;

  return (
    <FormSection
      title="Calendar"
      description="Block nights that are booked elsewhere (Airbnb, WhatsApp, owner) or set a seasonal nightly price. Pick the first night, then the check-out day."
    >
      <div className="flex justify-center rounded-2xl border border-border bg-background p-4">
        <Calendar
          mode="range"
          selected={range.from ? { from: fromIsoDate(range.from), to: range.to ? fromIsoDate(range.to) : undefined } : undefined}
          onSelect={onSelect}
          numberOfMonths={twoMonths ? 2 : 1}
          startMonth={fromIsoDate(today)}
          endMonth={fromIsoDate(horizon)}
          disabled={{ before: fromIsoDate(today) }}
          modifiers={{
            booked: (d: Date) => closed.has(toIsoDate(d)),
            seasonal: (d: Date) => seasonal.has(toIsoDate(d)),
          }}
          modifiersClassNames={{
            booked: "[&>button]:bg-danger/12 [&>button]:text-danger [&>button]:line-through",
            seasonal:
              "[&>button]:after:absolute [&>button]:after:bottom-1.5 [&>button]:after:left-1/2 [&>button]:after:size-1 [&>button]:after:-translate-x-1/2 [&>button]:after:rounded-full [&>button]:after:bg-gold-600 [&>button]:after:content-['']",
          }}
        />
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-muted text-xs" aria-label="Calendar key">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="rounded bg-danger/12 px-1 font-mono text-danger line-through">14</span> Blocked
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-gold-600" /> Seasonal price
        </li>
      </ul>

      <div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
        <p className="font-medium text-sm" aria-live="polite">
          {range.from
            ? range.to
              ? `${formatShortWeekdayDate(range.from)} → ${formatShortWeekdayDate(range.to)} · ${nights} night${nights === 1 ? "" : "s"}`
              : `${formatShortWeekdayDate(range.from)} → now pick the check-out day`
            : "Select dates on the calendar"}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-48 flex-1 flex-col gap-1.5 text-sm">
            <span className="font-medium">Reason</span>
            <Select value={reason} onChange={(e) => setReason(e.target.value as Reason)} options={REASONS} className="[&_select]:h-11 [&_select]:text-sm" />
          </label>
          {reason === "pricing" ? (
            <label className="flex w-48 flex-col gap-1.5 text-sm">
              <span className="font-medium">Nightly rate (KES)</span>
              <Input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="numeric" placeholder="e.g. 12000" className="h-11 font-mono text-sm" />
            </label>
          ) : null}
          <Button type="button" variant="green-solid" onClick={() => void add()} disabled={busy || !range.to}>
            <PlusIcon weight="bold" /> {reason === "pricing" ? "Add seasonal price" : "Block dates"}
          </Button>
        </div>
      </div>

      {upcoming.length ? (
        <ul className="flex flex-col divide-y divide-hairline rounded-2xl border border-border">
          {upcoming.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <CalendarXIcon className="size-5 shrink-0 text-muted" />
              <span className="font-medium">
                {formatShortWeekdayDate(b.starts_on)} → {formatShortWeekdayDate(b.ends_on)}
              </span>
              <Pill tone={b.reason === "pricing" ? "gold" : "danger"}>{reasonLabel(b.reason)}</Pill>
              {b.reason === "pricing" && b.nightly_override_kes ? (
                <span className="font-mono text-muted text-xs">KES {kes.format(b.nightly_override_kes)}/night</span>
              ) : null}
              <button
                type="button"
                onClick={() => void remove(b)}
                className="ml-auto grid size-8 place-items-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
                aria-label={`Remove ${formatShortWeekdayDate(b.starts_on)} to ${formatShortWeekdayDate(b.ends_on)}`}
              >
                <TrashIcon className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted text-sm">No blocked dates — every night is open for requests.</p>
      )}
    </FormSection>
  );
}
