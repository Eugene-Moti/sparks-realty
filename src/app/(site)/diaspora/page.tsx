import {
  BankIcon,
  ClipboardTextIcon,
  CurrencyDollarIcon,
  GavelIcon,
  HouseLineIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { FaqList, faqJsonLd, ProcessSteps } from "@/components/content/process-steps";
import { DiasporaForm } from "@/components/forms/diaspora-form";
import { PageHero } from "@/components/layout/page-hero";
import { Reveal, RevealGroup } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { getSiteSettings } from "@/lib/queries/site-settings";

export const metadata: Metadata = {
  title: "Buying in Nairobi from abroad",
  description:
    "For Kenyans abroad: live video-call viewings, prices in USD and KES, independent advocates and a local team that keeps you updated — buy or let in Nairobi with confidence.",
  alternates: { canonical: "/diaspora" },
};

const STEPS = [
  { title: "A first call in your time zone", body: "Tell us what you want, your budget and timeline. We'll suggest areas and homes that fit." },
  { title: "Shortlist with video tours", body: "Watch filmed tours of every listing, then join live video-call viewings where you can ask anything." },
  { title: "Independent checks", body: "You instruct your own advocate for searches, the sale agreement and transfer. We share everything they need." },
  { title: "Secure payments", body: "Deposits and balances are paid by bank transfer as your advocate directs — never in cash, never to an agent's personal account." },
  { title: "Completion and keys", body: "We coordinate hand-over, utilities and, if you're letting it out, finding and managing tenants." },
];

const PARTNERS = [
  { icon: GavelIcon, title: "Advocates", body: "Independent conveyancing advocates experienced with clients abroad and powers of attorney." },
  { icon: BankIcon, title: "Banks & mortgages", body: "Banks with diaspora mortgage and account-opening products." },
  { icon: ClipboardTextIcon, title: "Valuers & surveyors", body: "Registered valuers for bank valuations and independent surveys." },
  { icon: HouseLineIcon, title: "Property management", body: "Letting, rent collection and maintenance while you're away." },
];

const FAQS = [
  {
    q: "Can I buy property in Kenya while living abroad?",
    a: "Yes. Kenyan citizens can buy freehold or leasehold property from anywhere. Non-citizens can hold land on leasehold of up to 99 years. Your advocate will confirm what applies to the property you choose.",
  },
  {
    q: "Do I need to travel to Kenya to complete?",
    a: "Not necessarily. Many buyers view by video call and sign through a registered power of attorney or with documents executed abroad. Your advocate will explain the options.",
  },
  {
    q: "How do I pay safely from abroad?",
    a: "By bank transfer, as set out in the sale agreement and directed by your advocate. Always confirm account details by phone with your advocate before sending money. We never ask you to pay an agent's personal account.",
  },
  {
    q: "What costs should I budget for on top of the price?",
    a: "Typically stamp duty, legal fees, registration and valuation fees, and any bank charges. Your advocate will give you an itemised estimate before you commit.",
  },
  {
    q: "Can you manage the property after I buy?",
    a: "Yes — we can find and vet tenants, collect rent and arrange maintenance, with regular updates.",
  },
];

export default async function DiasporaPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <JsonLd data={faqJsonLd(FAQS)} />
      <PageHero
        tone="dark"
        eyebrow="Diaspora"
        title={
          <>
            Buying from abroad? <span className="text-gold-gradient">We&apos;ll be your eyes in Nairobi.</span>
          </>
        }
        description="Live video-call viewings, prices in USD and KES, independent advocates and a team that keeps you updated every week — wherever you are."
        crumbs={[{ name: "Diaspora", href: "/diaspora" }]}
      >
        <div className="flex flex-wrap gap-3 pt-3">
          <Button asChild size="lg" variant="green-solid">
            <a href="#talk">
              <VideoCameraIcon /> Book a video-call viewing
            </a>
          </Button>
          <Button asChild size="lg" variant="gold-outline">
            <Link href="/buy">Browse homes for sale</Link>
          </Button>
        </div>
      </PageHero>

      <section aria-labelledby="how-title" className="mx-auto grid w-full max-w-[90rem] gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-10 lg:py-28">
        <div className="flex flex-col gap-10">
          <SectionHeading id="how-title" eyebrow="How it works" title="Five steps, all from your phone" />
          <ProcessSteps steps={STEPS} />
        </div>
        <div className="flex flex-col gap-6">
          <Reveal className="dark grain relative flex flex-col gap-4 overflow-hidden rounded-(--radius-card) bg-ink p-7 text-ivory">
            <VideoCameraIcon className="size-9 text-gold" />
            <h3 className="font-display text-3xl">Live video-call viewings</h3>
            <p className="text-ivory/70 leading-relaxed">
              An agent walks the home with you on WhatsApp video or Google Meet: open cupboards, check the water pressure, look out of
              every window, see the neighbourhood. Ask anything — we&apos;ll answer on the spot.
            </p>
            <p className="font-mono text-ivory/50 text-xs">Tell us your time zone and we&apos;ll suggest call times that suit you.</p>
          </Reveal>
          <Reveal className="flex flex-col gap-4 rounded-(--radius-card) border border-hairline bg-surface p-7">
            <CurrencyDollarIcon className="size-9 text-accent" />
            <h3 className="font-display text-3xl">Prices in USD and KES</h3>
            <p className="text-muted leading-relaxed">
              Every price is listed in Kenya Shillings with a US dollar guide. Switch currency with the KES / USD toggle at the top of
              any page.
            </p>
            <p className="rounded-2xl border border-hairline bg-background px-4 py-3 font-mono text-muted text-xs">
              Guide rate today: KES {settings.usdRate.toFixed(2)} = US$1 · Final amounts are always agreed in KES.
            </p>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="partners-title" className="bg-surface-2/50 py-20 lg:py-28">
        <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-10">
          <SectionHeading
            id="partners-title"
            eyebrow="Trusted partners"
            title="Independent professionals, your choice"
            description="We introduce you to licensed professionals we've worked with. You instruct and pay them directly — they work for you, not for us."
          />
          <RevealGroup as="ul" className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PARTNERS.map((p) => (
              <Reveal as="li" key={p.title} className="flex flex-col gap-3 rounded-(--radius-card) border border-hairline bg-background p-6">
                <p.icon className="size-8 text-accent" />
                <h3 className="font-display text-xl">{p.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{p.body}</p>
                <p className="mt-auto pt-2 text-muted text-xs">Introductions on request.</p>
              </Reveal>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section
        id="talk"
        aria-labelledby="talk-title"
        className="mx-auto grid w-full max-w-[90rem] scroll-mt-24 gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:px-10 lg:py-28"
      >
        <div className="flex flex-col gap-8">
          <SectionHeading id="talk-title" eyebrow="Get started" title="Tell us what you're looking for" />
          <FaqList items={FAQS} />
        </div>
        <div className="rounded-(--radius-card) border border-hairline bg-surface p-5 shadow-soft sm:p-8 lg:sticky lg:top-28 lg:self-start">
          <DiasporaForm />
        </div>
      </section>
    </>
  );
}
