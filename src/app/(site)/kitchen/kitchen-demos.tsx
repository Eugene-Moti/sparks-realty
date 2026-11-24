"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon, InfoIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { MobileContactBar } from "@/components/layout/mobile-contact-bar";
import { DynamicButton, type DynamicButtonState } from "@/components/motion/dynamic-button";
import { Magnetic } from "@/components/motion/magnetic";
import { ReceiptPrinter, type ReceiptPrinterStage } from "@/components/motion/receipt-printer";
import { ConsentFields } from "@/components/privacy/consent-fields";
import { useCurrency } from "@/components/providers/currency-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Chip, ToggleGroup } from "@/components/ui/toggle-group";
import { Tooltip } from "@/components/ui/tooltip";
import { cookieConsent } from "@/lib/consent/cookie-consent";
import { formatKES } from "@/lib/format";
import { consentDefaults, consentShape, HONEYPOT_FIELD } from "@/lib/validation/consent";

export function FormControlsDemo() {
  const [beds, setBeds] = useState("any");
  const [amenities, setAmenities] = useState<string[]>(["pool"]);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex flex-col gap-5">
        <Field label="Full name" required hint="As you'd like us to address you.">
          {(ids) => <Input {...ids} placeholder="Jane Wanjiru" autoComplete="name" />}
        </Field>
        <Field label="Phone" required error="Enter a valid Kenyan or international number.">
          {(ids) => <Input {...ids} type="tel" defaultValue="+254 7" />}
        </Field>
        <Field label="Property type">
          {(ids) => (
            <Select
              {...ids}
              placeholder="Any type"
              options={[
                { value: "apartment", label: "Apartment" },
                { value: "maisonette", label: "Maisonette" },
                { value: "townhouse", label: "Townhouse" },
                { value: "villa", label: "Villa" },
              ]}
            />
          )}
        </Field>
        <Field label="Message">{(ids) => <Textarea {...ids} placeholder="Tell us what you're looking for…" />}</Field>
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="font-medium text-sm">Bedrooms (single)</p>
          <ToggleGroup type="single" value={beds} onValueChange={(v) => v && setBeds(v)} aria-label="Bedrooms">
            {["any", "1", "2", "3", "4", "5+"].map((b) => (
              <Chip key={b} value={b}>
                {b === "any" ? "Any" : b}
              </Chip>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex flex-col gap-3">
          <p className="font-medium text-sm">Amenities (multiple)</p>
          <ToggleGroup type="multiple" value={amenities} onValueChange={setAmenities} aria-label="Amenities">
            {["pool", "gym", "lift", "borehole", "backup generator", "DSQ", "garden", "pet friendly"].map((a) => (
              <Chip key={a} value={a} className="capitalize">
                {a}
              </Chip>
            ))}
          </ToggleGroup>
        </div>
        <Checkbox label="Furnished only" description="Hide unfurnished listings." />
        <Checkbox label="Disabled option" disabled />
      </div>
    </div>
  );
}

export function OverlaysDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="gold-outline">Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book a viewing</DialogTitle>
            <DialogDescription>Choose a time that suits you — in person or by video call.</DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-relaxed">
            Dialogs trap focus, close on Escape and restore focus to the trigger. Page scroll (and
            Lenis) is paused while open.
          </p>
        </DialogContent>
      </Dialog>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="gold-outline">Side sheet</Button>
        </SheetTrigger>
        <SheetContent side="right" className="p-6 pt-16">
          <SheetTitle className="font-display text-2xl">Filters</SheetTitle>
          <SheetDescription className="mt-2 text-muted text-sm">
            Mobile filters slide in from the side.
          </SheetDescription>
          <div className="mt-8 flex flex-col gap-3">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="h-12 rounded-xl bg-foreground/5" />
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="gold-outline">Bottom sheet</Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="px-6 pt-4 pb-8">
          <SheetTitle className="font-display text-2xl">Share this home</SheetTitle>
          <SheetDescription className="mt-2 text-muted text-sm">Bottom sheets suit phones.</SheetDescription>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {["WhatsApp", "Facebook", "Copy link"].map((l) => (
              <Button key={l} variant="ghost" className="h-16 rounded-2xl border border-border">
                {l}
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Tooltip content="Service charge is billed monthly by the management company.">
        <Button variant="ghost" size="icon" aria-label="What is service charge?">
          <InfoIcon />
        </Button>
      </Tooltip>
    </div>
  );
}

export function DynamicButtonDemo() {
  const [state, setState] = useState<DynamicButtonState>("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function run(outcome: "success" | "error") {
    timers.current.forEach(clearTimeout);
    setState("loading");
    timers.current = [
      window.setTimeout(() => setState(outcome), 1400),
      window.setTimeout(() => setState("idle"), 3800),
    ];
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <DynamicButton
        type="button"
        state={state}
        onClick={() => run("success")}
        labels={{ idle: "Send request", loading: "Sending…", success: "Request sent", error: "Try again" }}
        idleIcon={<ArrowRightIcon />}
      />
      <Button variant="ghost" size="sm" onClick={() => run("error")}>
        Simulate error
      </Button>
    </div>
  );
}

export function MagneticDemo() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <Magnetic>
        <Button size="lg">Book a viewing</Button>
      </Magnetic>
      <Magnetic strength={0.4}>
        <Button variant="gold-outline" size="lg">
          List your property
        </Button>
      </Magnetic>
      <p className="text-muted text-xs">Desktop pointer only · off under reduced motion</p>
    </div>
  );
}

const nextStage: Record<ReceiptPrinterStage, ReceiptPrinterStage> = {
  processing: "printing",
  printing: "complete",
  complete: "processing",
};

export function ReceiptPrinterDemo() {
  const [stage, setStage] = useState<ReceiptPrinterStage>("processing");
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function play() {
    timers.current.forEach(clearTimeout);
    setStage("processing");
    timers.current = [
      window.setTimeout(() => setStage("printing"), 1100),
      window.setTimeout(() => setStage("complete"), 1100 + 1800),
    ];
  }

  return (
    <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:gap-12">
      <ReceiptPrinter.Root stage={stage} aria-label="Viewing request slip">
        <ReceiptPrinter.Machine>
          <ReceiptPrinter.Header>
            <span className="font-mono text-[0.6rem] text-grayscale-6 uppercase tracking-[0.3em]">Sparks Properties</span>
            <span className="font-mono text-[0.6rem] text-grayscale-6">SP-0012</span>
          </ReceiptPrinter.Header>
          <ReceiptPrinter.Screen>
            <ReceiptPrinter.Status />
          </ReceiptPrinter.Screen>
        </ReceiptPrinter.Machine>
        <ReceiptPrinter.Output>
          <ReceiptPrinter.Paper>
            <ReceiptPrinter.Brand subtitle="Viewing request slip" />
            <ReceiptPrinter.Row label="Property" value="4 Bed Maisonette, Kileleshwa" />
            <ReceiptPrinter.Row label="Ref" value="SP-0012" />
            <ReceiptPrinter.Row label="Date" value="Sat 21 Nov 2026" />
            <ReceiptPrinter.Row label="Time" value="10:30" />
            <ReceiptPrinter.Row label="Type" value="In person" />
            <ReceiptPrinter.Divider />
            <ReceiptPrinter.Row label="Agent" value="Your Sparks Properties agent" />
            <ReceiptPrinter.Row label="Price" value={formatKES(35_000_000)} />
            <ReceiptPrinter.Divider />
            <ReceiptPrinter.Total label="Status" value="Received" />
            <ReceiptPrinter.Barcode value="enq-7f3a9c21" />
          </ReceiptPrinter.Paper>
        </ReceiptPrinter.Output>
      </ReceiptPrinter.Root>

      <div className="flex flex-col gap-3 lg:pt-6">
        <Button onClick={play}>Play the full sequence</Button>
        <Button variant="ghost" size="sm" onClick={() => setStage((s) => nextStage[s])}>
          Step stage (now: {stage})
        </Button>
        <p className="max-w-xs text-muted text-xs leading-relaxed">
          Used after viewing, enquiry and short-stay requests, and as the live short-stay quote.
          Under reduced motion the slip appears without the feed animation.
        </p>
      </div>
    </div>
  );
}

const demoSchema = z.object({
  name: z.string().min(2, { error: "Please enter your name." }),
  ...consentShape,
});
type DemoValues = z.infer<typeof demoSchema> & { [HONEYPOT_FIELD]?: string };

export function ConsentFormDemo() {
  const [state, setState] = useState<DynamicButtonState>("idle");
  const form = useForm<DemoValues>({
    resolver: zodResolver(demoSchema),
    defaultValues: { name: "", ...consentDefaults, [HONEYPOT_FIELD]: "" },
  });
  const nameError = form.formState.errors.name?.message;

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(() => {
          setState("loading");
          window.setTimeout(() => setState("success"), 900);
          window.setTimeout(() => {
            setState("idle");
            form.reset();
          }, 3000);
        })}
        className="relative flex max-w-xl flex-col gap-5"
      >
        <Field label="Your name" required error={nameError}>
          {(ids) => <Input {...ids} {...form.register("name")} autoComplete="name" />}
        </Field>
        <ConsentFields />
        <div>
          <DynamicButton state={state} labels={{ idle: "Send enquiry" }} />
        </div>
        <p className="text-muted text-xs">
          Try submitting without the first box ticked. (Demo only — nothing is sent.)
        </p>
      </form>
    </FormProvider>
  );
}

export function CookieSettingsDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="gold-outline" onClick={cookieConsent.openSettings}>
        Open cookie settings
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          try {
            localStorage.removeItem("sp-cookie-consent");
          } catch {}
          window.location.reload();
        }}
      >
        Reset choice &amp; show banner
      </Button>
    </div>
  );
}

export function PriceDemo() {
  const { format, currency } = useCurrency();
  const samples = [
    { label: "Sale", price: { priceKes: 35_000_000, period: "once" as const } },
    { label: "Rent", price: { priceKes: 180_000, period: "month" as const } },
    { label: "Short stay", price: { priceKes: 12_500, period: "night" as const } },
    { label: "On request", price: { priceKes: null, priceOnRequest: true } },
  ];
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted text-sm">
        Showing <span className="font-mono text-accent">{currency}</span> — switch with the toggle in the header.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {samples.map(({ label, price }) => {
          const p = format(price);
          return (
            <div key={label} className="rounded-(--radius-card) border border-hairline bg-surface p-5">
              <p className="eyebrow">{label}</p>
              <p className="mt-3 font-mono text-lg">{p.primary}</p>
              <p className="mt-1 font-mono text-muted text-xs">{p.secondary || "—"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MobileContactBarDemo() {
  return (
    <div className="max-w-sm">
      <MobileContactBar
        inline
        phone="+254792573443"
        whatsappNumber="254792573443"
        whatsappMessage="Hi Sparks Properties, I'm interested in 4 Bed Maisonette, Kileleshwa (SP-0012) — sample"
        bookHref="#"
      />
    </div>
  );
}
