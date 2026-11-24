import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CountUp } from "@/components/motion/count-up";
import { Marquee } from "@/components/motion/marquee";
import { Reveal, RevealGroup } from "@/components/motion/reveal";
import { WordReveal } from "@/components/motion/word-reveal";
import { ClickToLoadEmbed } from "@/components/privacy/click-to-load-embed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ConsentFormDemo,
  CookieSettingsDemo,
  DynamicButtonDemo,
  FormControlsDemo,
  MagneticDemo,
  MobileContactBarDemo,
  OverlaysDemo,
  PriceDemo,
  ReceiptPrinterDemo,
} from "./kitchen-demos";

export const metadata: Metadata = {
  title: "Kitchen",
  description: "Internal design-system review page.",
  robots: { index: false, follow: false },
};

const swatches: { name: string; className: string; text?: string }[] = [
  { name: "ink", className: "bg-ink", text: "text-ivory" },
  { name: "ink-2", className: "bg-ink-2", text: "text-ivory" },
  { name: "ink-3", className: "bg-ink-3", text: "text-ivory" },
  { name: "ivory", className: "bg-ivory border border-border" },
  { name: "sand", className: "bg-sand" },
  { name: "gold-200", className: "bg-gold-200" },
  { name: "gold-400", className: "bg-gold-400" },
  { name: "gold-600", className: "bg-gold-600", text: "text-ivory" },
  { name: "gold-700", className: "bg-gold-700", text: "text-ivory" },
  { name: "green-400", className: "bg-green-400" },
  { name: "green-500", className: "bg-green-500", text: "text-ivory" },
  { name: "green-600", className: "bg-green-600", text: "text-ivory" },
];

const grays = Array.from({ length: 12 }, (_, i) => i + 1);
const grayBg: Record<number, string> = {
  1: "bg-grayscale-1", 2: "bg-grayscale-2", 3: "bg-grayscale-3", 4: "bg-grayscale-4",
  5: "bg-grayscale-5", 6: "bg-grayscale-6", 7: "bg-grayscale-7", 8: "bg-grayscale-8",
  9: "bg-grayscale-9", 10: "bg-grayscale-10", 11: "bg-grayscale-11", 12: "bg-grayscale-12",
};

const areas = ["Kileleshwa", "Westlands", "Kilimani", "Lavington", "Riverside", "Karen", "Runda", "Kitisuru", "Spring Valley", "Upper Hill"];

export default function KitchenPage() {
  return (
    <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-24 px-4 py-16 sm:px-6 lg:px-10">
      <header className="flex flex-col gap-4">
        <p className="eyebrow">Internal · not indexed</p>
        <h1 className="text-5xl sm:text-6xl">The kitchen</h1>
        <p className="max-w-2xl text-muted">
          Every primitive and motion component in one place. Use the sun/moon in the header to
          review both themes, and turn on “reduce motion” in your OS to check the static fallbacks.
        </p>
      </header>

      <Section title="Colour">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {swatches.map((s) => (
            <div key={s.name} className={`flex h-24 items-end rounded-2xl p-3 ${s.className} ${s.text ?? "text-ink"}`}>
              <span className="font-mono text-xs">{s.name}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-6 gap-1 overflow-hidden rounded-2xl sm:grid-cols-12">
          {grays.map((g) => (
            <div key={g} className={`flex h-16 items-end p-2 ${grayBg[g]} ${g > 6 ? "text-ivory" : "text-ink"}`}>
              <span className="font-mono text-[0.6rem]">{g}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-5">
          <p className="eyebrow">Eyebrow · tracked caps</p>
          <p className="font-display text-6xl leading-none sm:text-7xl">Marcellus display</p>
          <p className="font-display text-gold-gradient text-5xl">Nairobi night luxury</p>
          <p className="max-w-2xl text-lg leading-relaxed">
            Geist Sans for body and UI. A light-filled four-bedroom maisonette on a quiet Kileleshwa
            close, minutes from Yaya Centre, with a DSQ, borehole and backup generator.
          </p>
          <p className="font-mono text-xl">KES 35,000,000 · SP-0012 · /month · /night</p>
        </div>
      </Section>

      <Section title="Buttons & badges">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Green solid</Button>
            <Button variant="gold-outline">Gold outline</Button>
            <Button variant="solid">Solid</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link style</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Neutral</Badge>
            <Badge variant="gold">Featured</Badge>
            <Badge variant="green">New this week</Badge>
            <Badge variant="outline">Short stay</Badge>
            <Badge variant="danger">Price drop</Badge>
            <Badge variant="status" caps size="sm">Under offer</Badge>
            <span className="rounded-full bg-ink p-2">
              <Badge variant="glass">Video tour</Badge>
            </span>
          </div>
        </div>
      </Section>

      <Section title="Form controls">
        <FormControlsDemo />
      </Section>

      <Section title="Dialog · Sheet · Tooltip">
        <OverlaysDemo />
      </Section>

      <Section title="Skeleton">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-3 rounded-(--radius-card) border border-hairline bg-surface p-3">
              <Skeleton className="aspect-4/3 rounded-2xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Section heading">
        <div className="flex flex-col gap-16">
          <SectionHeading
            eyebrow="Featured listings"
            title="Homes worth coming home to"
            description="Hand-picked across Nairobi's most liveable neighbourhoods."
            action={<Button variant="gold-outline">View all properties</Button>}
          />
          <SectionHeading align="center" eyebrow="Areas" title="Know the neighbourhood" />
        </div>
      </Section>

      <Section title="Reveal & WordReveal">
        <div className="flex flex-col gap-10">
          <WordReveal as="h3" className="max-w-3xl text-4xl leading-tight sm:text-5xl" text="Find a home that sparks something." />
          <RevealGroup className="grid gap-4 sm:grid-cols-3">
            {["Buy", "Rent", "Short stays"].map((t) => (
              <Reveal key={t} className="rounded-(--radius-card) border border-hairline bg-surface p-8">
                <p className="eyebrow">Live with Sparks Properties</p>
                <p className="mt-3 font-display text-3xl">{t}</p>
              </Reveal>
            ))}
          </RevealGroup>
        </div>
      </Section>

      <Section title="CountUp & Marquee">
        <div className="dark grain relative flex flex-col gap-10 overflow-hidden rounded-(--radius-card-lg) border border-hairline bg-ink p-8 text-ivory sm:p-12">
          <dl className="relative z-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { label: "Homes sold", value: 240, suffix: "+" },
              { label: "Happy clients", value: 1200, suffix: "+" },
              { label: "Years", value: 12 },
              { label: "Areas covered", value: 14 },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-2">
                <dt className="eyebrow">{s.label}</dt>
                <dd className="font-display text-5xl text-gold">
                  <CountUp value={s.value} suffix={s.suffix} />
                </dd>
              </div>
            ))}
          </dl>
          <Marquee className="relative z-10" duration={35}>
            {areas.map((a) => (
              <span key={a} className="flex items-center gap-6 px-6 font-display text-3xl text-ivory/80">
                {a}
                <span aria-hidden="true" className="size-1.5 rounded-full bg-gold" />
              </span>
            ))}
          </Marquee>
          <p className="relative z-10 text-ivory/50 text-xs">
            Sample stat values. Real ones come from Admin → Settings.
          </p>
        </div>
      </Section>

      <Section title="Magnetic">
        <MagneticDemo />
      </Section>

      <Section title="DynamicButton">
        <DynamicButtonDemo />
      </Section>

      <Section title="ReceiptPrinter">
        <ReceiptPrinterDemo />
      </Section>

      <Section title="Prices (KES / USD)">
        <PriceDemo />
      </Section>

      <Section title="Privacy: consent fields">
        <ConsentFormDemo />
      </Section>

      <Section title="Privacy: cookie banner & settings">
        <CookieSettingsDemo />
      </Section>

      <Section title="Privacy: click-to-load embeds">
        <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
          <ClickToLoadEmbed
            url="https://www.youtube.com/watch?v=aqz-KE-bpKQ"
            title="Sample tour video (placeholder — staff add real tours in the admin)"
          />
          <ClickToLoadEmbed
            url="https://www.youtube.com/shorts/aqz-KE-bpKQ"
            title="Portrait / Shorts layout (placeholder)"
          />
        </div>
      </Section>

      <Section title="Mobile contact bar (listing pages)">
        <MobileContactBarDemo />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <h2 className="shrink-0 font-sans font-medium text-muted text-xs uppercase tracking-[0.3em]">{title}</h2>
        <span aria-hidden="true" className="h-px flex-1 bg-hairline" />
      </div>
      {children}
    </section>
  );
}
