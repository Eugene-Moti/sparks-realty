import { CompassIcon, EyeIcon, HandshakeIcon, SparkleIcon, WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TrustStrip } from "@/components/home/trust-strip";
import { PageHero } from "@/components/layout/page-hero";
import { Reveal, RevealGroup } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { absoluteUrl } from "@/config/site";
import { whatsappLink } from "@/lib/format";
import { getAreasWithStats } from "@/lib/queries/areas";
import { getSiteSettings } from "@/lib/queries/site-settings";
import { getPublicTeam, type TeamMember } from "@/lib/queries/team";

export const metadata: Metadata = {
  title: "About Sparks Properties",
  description:
    "Sparks Properties is a Nairobi real-estate agency based on Arboretum Drive — sales, long-term rentals and short stays, with honest advice and homes we've visited ourselves.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  { icon: EyeIcon, title: "We see it first", body: "We visit, photograph and film every home we list, so what you see online is what you'll find." },
  { icon: HandshakeIcon, title: "Straight talk", body: "Honest prices, clear fees and no pressure. If a home isn't right for you, we'll say so." },
  { icon: CompassIcon, title: "Local knowledge", body: "We live and work in these neighbourhoods — schools, roads, water, security — and share what we know." },
  { icon: SparkleIcon, title: "Care in the details", body: "From the first WhatsApp to the hand-over, we look after you like family." },
];

export default async function AboutPage() {
  const [settings, team, areas] = await Promise.all([getSiteSettings(), getPublicTeam(), getAreasWithStats()]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          url: absoluteUrl("/about"),
          mainEntity: {
            "@type": "RealEstateAgent",
            "@id": `${absoluteUrl("/")}#agent`,
            name: settings.companyName,
            employee: team.map((m) => ({ "@type": "Person", name: m.full_name, ...(m.avatar_url ? { image: m.avatar_url } : {}) })),
          },
        }}
      />
      <PageHero
        tone="dark"
        eyebrow="About us"
        title={
          <>
            A Nairobi agency that <span className="text-gold-gradient">shows up.</span>
          </>
        }
        description="Sparks Properties helps people buy, rent and stay in Nairobi's best neighbourhoods — from our office at Arbor House, Arboretum Drive."
        crumbs={[{ name: "About", href: "/about" }]}
      />

      <section aria-labelledby="story-title" className="mx-auto grid w-full max-w-[90rem] gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20 lg:px-10 lg:py-28">
        <SectionHeading id="story-title" eyebrow="Our story" title="Home-finding, done properly" />
        <Reveal className="flex flex-col gap-5 text-foreground/80 text-lg leading-relaxed">
          <p>
            Finding a home in Nairobi shouldn&apos;t mean blurry photos, listings that vanish and agents who stop answering. We started
            Sparks Properties to do it differently: visit every home, film it properly, price it honestly and answer every message.
          </p>
          <p>
            Today we help families, professionals, investors and Kenyans abroad find homes to buy, rent and stay in — across
            Kileleshwa, Kilimani, Lavington, Westlands, Riverside, Karen and beyond.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild variant="green-solid">
              <a href={whatsappLink("Hi Sparks Properties, I'd like to talk to an agent.", settings.whatsapp)} target="_blank" rel="noopener noreferrer">
                <WhatsappLogoIcon weight="fill" /> Talk to an agent
              </a>
            </Button>
            <Button asChild variant="gold-outline">
              <Link href="/list-with-us">List your property</Link>
            </Button>
          </div>
        </Reveal>
      </section>

      <TrustStrip stats={settings.stats} areaNames={areas.map((a) => a.name)} />

      <section aria-labelledby="values-title" className="mx-auto w-full max-w-[90rem] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <SectionHeading id="values-title" eyebrow="What we stand for" title="Four promises" align="center" />
        <RevealGroup as="ul" className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <Reveal as="li" key={v.title} className="flex flex-col gap-4 rounded-(--radius-card) border border-hairline bg-surface p-6 shadow-soft">
              <v.icon className="size-8 text-accent" />
              <h3 className="font-display text-xl">{v.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{v.body}</p>
            </Reveal>
          ))}
        </RevealGroup>
      </section>

      {team.length ? (
        <section id="team" aria-labelledby="team-title" className="scroll-mt-24 bg-surface-2/50 py-20 lg:py-28">
          <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-10">
            <SectionHeading id="team-title" eyebrow="Our team" title="The people you'll deal with" />
            <RevealGroup as="ul" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {team.map((m) => (
                <TeamCard key={m.id} member={m} />
              ))}
            </RevealGroup>
          </div>
        </section>
      ) : null}
    </>
  );
}

function TeamCard({ member: m }: { member: TeamMember }) {
  const wa = m.whatsapp || m.phone;
  return (
    <Reveal as="li" className="group flex flex-col overflow-hidden rounded-(--radius-card) border border-hairline bg-background">
      <div className="relative aspect-4/5 overflow-hidden bg-ink">
        {m.avatar_url ? (
          <Image
            src={m.avatar_url}
            alt={`${m.full_name}, Sparks Properties`}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-[1.2s] ease-(--ease-out-brand) group-hover:scale-[1.04]"
          />
        ) : (
          <span aria-hidden="true" className="grid size-full place-items-center font-display text-7xl text-gold">
            {(m.full_name ?? "?").slice(0, 1)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-display text-2xl leading-tight">{m.full_name}</h3>
          <p className="eyebrow mt-1 text-muted">{m.role === "agent" ? "Property agent" : "Sparks Properties team"}</p>
        </div>
        {m.bio ? <p className="line-clamp-5 text-muted text-sm leading-relaxed">{m.bio}</p> : null}
        {wa ? (
          <Button asChild size="sm" variant="ghost" className="mt-auto self-start border border-hairline">
            <a href={whatsappLink(`Hi ${m.full_name?.split(" ")[0]}, I found you on the Sparks Properties website.`, wa)} target="_blank" rel="noopener noreferrer">
              <WhatsappLogoIcon weight="fill" className="text-green-600" /> WhatsApp {m.full_name?.split(" ")[0]}
            </a>
          </Button>
        ) : null}
      </div>
    </Reveal>
  );
}
