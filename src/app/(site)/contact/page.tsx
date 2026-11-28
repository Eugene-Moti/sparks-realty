import { ClockIcon, EnvelopeSimpleIcon, MapPinIcon, PhoneIcon, WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { SocialIcons } from "@/components/brand/social-icons";
import { ContactForm } from "@/components/forms/contact-form";
import { PageHero } from "@/components/layout/page-hero";
import { ClickToLoadFrame } from "@/components/privacy/click-to-load-frame";
import { siteConfig } from "@/config/site";
import { formatPhoneDisplay, telLink, whatsappLink } from "@/lib/format";
import { getSiteSettings } from "@/lib/queries/site-settings";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Call, WhatsApp, email or visit Sparks Properties at Arbor House Business Centre, Arboretum Drive, Nairobi — or send us a message and an agent will get back to you.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's talk about your next home"
        description="Message us here, or reach the team directly on WhatsApp — it's the fastest way to get an answer."
        crumbs={[{ name: "Contact", href: "/contact" }]}
      />

      <div className="mx-auto grid w-full max-w-[90rem] gap-10 px-4 pb-24 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14 lg:px-10">
        <section aria-labelledby="form-title" className="rounded-(--radius-card) border border-hairline bg-surface p-5 shadow-soft sm:p-8">
          <h2 id="form-title" className="mb-6 font-display text-3xl">
            Send a message
          </h2>
          <ContactForm />
        </section>

        <aside className="flex flex-col gap-6" aria-label="Other ways to reach us">
          <ul className="grid gap-3">
            <Channel
              icon={<WhatsappLogoIcon weight="fill" />}
              label="WhatsApp"
              value={formatPhoneDisplay(settings.whatsapp)}
              href={whatsappLink("Hi Sparks Properties, I'd like some help finding a home.", settings.whatsapp)}
              external
              accent
            />
            <Channel icon={<PhoneIcon />} label="Call" value={formatPhoneDisplay(settings.phone)} href={telLink(settings.phone)} />
            <Channel icon={<EnvelopeSimpleIcon />} label="Email" value={settings.email} href={`mailto:${settings.email}`} />
            <Channel icon={<ClockIcon />} label="Office hours" value={settings.officeHours} />
            <Channel icon={<MapPinIcon />} label="Office" value={settings.address} />
          </ul>

          <ClickToLoadFrame kind="map" url={siteConfig.contact.maps.embedUrl} title="Arbor House Business Centre, Arboretum Drive" />
          <p className="-mt-3 flex flex-wrap items-center justify-between gap-2 text-muted text-xs">
            <span>Visits are by appointment — WhatsApp us before you come.</span>
            <a href={siteConfig.contact.maps.directionsUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-accent underline-offset-2 hover:underline">
              Get directions in Google Maps
            </a>
          </p>

          <div className="flex flex-col gap-3 rounded-(--radius-card) border border-hairline p-5">
            <p className="eyebrow">Follow our tours</p>
            <SocialIcons hrefs={settings.social} />
          </div>

          <div className="rounded-(--radius-card) border border-hairline p-5 text-sm leading-relaxed">
            <p className="font-medium">Own a property?</p>
            <p className="mt-1 text-muted">
              Get a free valuation and let us sell or let it for you.{" "}
              <Link href="/list-with-us" className="text-accent underline underline-offset-4">
                List with us
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

function Channel({
  icon,
  label,
  value,
  href,
  external,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
  accent?: boolean;
}) {
  const body = (
    <>
      <span
        className={
          accent
            ? "grid size-11 shrink-0 place-items-center rounded-full bg-green-600 text-ivory [&_svg]:size-5"
            : "grid size-11 shrink-0 place-items-center rounded-full border border-hairline text-accent [&_svg]:size-5"
        }
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-muted text-xs">{label}</span>
        <span className="truncate font-medium">{value}</span>
      </span>
    </>
  );
  const cls = "flex items-center gap-4 rounded-2xl border border-hairline bg-surface px-4 py-3";
  return (
    <li>
      {href ? (
        <a href={href} className={`${cls} transition-colors hover:border-gold/60`} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {body}
        </a>
      ) : (
        <div className={cls}>{body}</div>
      )}
    </li>
  );
}
