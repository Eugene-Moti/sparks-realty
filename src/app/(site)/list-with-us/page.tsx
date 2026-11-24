import { CameraIcon, HandshakeIcon, ShieldCheckIcon, UsersThreeIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { FaqList, faqJsonLd, ProcessSteps } from "@/components/content/process-steps";
import { ListWithUsForm } from "@/components/forms/list-with-us-form";
import { PageHero } from "@/components/layout/page-hero";
import { Reveal, RevealGroup } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { SectionHeading } from "@/components/ui/section-heading";
import { getAreasWithStats } from "@/lib/queries/areas";

export const metadata: Metadata = {
  title: "List your property with us",
  description:
    "Sell or let your Nairobi property with Sparks Properties — free valuation, professional photos and video tours, vetted buyers and tenants, and a written agreement before we start.",
  alternates: { canonical: "/list-with-us" },
};

const WHY = [
  { icon: CameraIcon, title: "Filmed and photographed", body: "Every home gets professional photos and a video tour shared on our website, YouTube, TikTok and Instagram." },
  { icon: UsersThreeIcon, title: "Serious buyers and tenants", body: "We pre-qualify every enquiry — including diaspora buyers — before anyone visits your home." },
  { icon: ShieldCheckIcon, title: "Clear, in writing", body: "Fees, marketing plan and responsibilities are agreed in writing before your listing goes live." },
  { icon: HandshakeIcon, title: "One point of contact", body: "A named agent handles viewings, offers and paperwork and updates you every week." },
];

const STEPS = [
  { title: "Tell us about the property", body: "Send the form or WhatsApp us. We'll call you back the same working day." },
  { title: "Free visit and valuation", body: "An agent visits, checks the home and advises on price or rent using recent local results." },
  { title: "Agree the terms", body: "You get a written mandate with our fees and marketing plan. No surprises later." },
  { title: "Photos, video and launch", body: "We shoot the home, write the listing and launch it on the website and our social channels." },
  { title: "Viewings and offers", body: "We host viewings (in person or by video call), vet buyers or tenants and negotiate for you." },
  { title: "Completion and hand-over", body: "We coordinate with advocates on sales, or handle the lease, deposit and move-in on lettings." },
];

const FAQS = [
  { q: "How much does it cost to list?", a: "The visit and valuation are free. Our fee depends on whether you're selling or letting and is agreed in writing before we market the property — you only pay as set out in that agreement." },
  { q: "Do I need a title deed to list?", a: "For a sale we'll need to see proof of ownership (title deed or lease) before marketing. For lettings, proof that you own the property or are authorised to let it." },
  { q: "Can you manage short-stay lettings?", a: "Yes. Choose “Short-stay letting” on the form and we'll talk you through pricing, calendars, cleaning and guest communication." },
  { q: "Will my exact address be published?", a: "No. Listings show the area and an approximate location only. We share the exact address with confirmed viewers." },
];

export default async function ListWithUsPage() {
  const areas = await getAreasWithStats();

  return (
    <>
      <JsonLd data={faqJsonLd(FAQS)} />
      <PageHero
        tone="dark"
        eyebrow="Landlords & sellers"
        title={
          <>
            Sell or let with <span className="text-gold-gradient">Sparks Properties</span>
          </>
        }
        description="A free valuation, beautiful marketing and buyers or tenants who are ready to move — with everything agreed in writing first."
        crumbs={[{ name: "List with us", href: "/list-with-us" }]}
      />

      <section aria-labelledby="why-title" className="mx-auto w-full max-w-[90rem] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <SectionHeading id="why-title" eyebrow="Why Sparks Properties" title="Marketing that does your home justice" />
        <RevealGroup as="ul" className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((w) => (
            <Reveal as="li" key={w.title} className="flex flex-col gap-4 rounded-(--radius-card) border border-hairline bg-surface p-6 shadow-soft">
              <w.icon className="size-8 text-accent" />
              <h3 className="font-display text-xl">{w.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{w.body}</p>
            </Reveal>
          ))}
        </RevealGroup>
      </section>

      <section
        id="valuation"
        aria-labelledby="valuation-title"
        className="mx-auto grid w-full max-w-[90rem] scroll-mt-24 gap-12 px-4 pb-24 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:px-10"
      >
        <div className="flex flex-col gap-10">
          <SectionHeading eyebrow="How it works" title="From first call to keys handed over" />
          <ProcessSteps steps={STEPS} />
        </div>
        <div className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-(--radius-card) border border-hairline bg-surface p-5 shadow-soft sm:p-8">
            <h2 id="valuation-title" className="mb-1 font-display text-3xl">
              Request a free valuation
            </h2>
            <p className="mb-6 text-muted text-sm">Takes two minutes. No obligation.</p>
            <ListWithUsForm areas={areas.map((a) => a.name)} />
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="mx-auto w-full max-w-4xl px-4 pb-28 sm:px-6">
        <h2 id="faq-title" className="mb-8 text-center font-display text-[clamp(2rem,4vw,3rem)]">
          Questions owners ask
        </h2>
        <FaqList items={FAQS} />
      </section>
    </>
  );
}
