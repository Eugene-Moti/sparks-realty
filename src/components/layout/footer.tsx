import {
  ClockIcon,
  EnvelopeSimpleIcon,
  MapPinIcon,
  PhoneIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cacheLife } from "next/cache";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { SocialIcons } from "@/components/brand/social-icons";
import { CookieSettingsLink } from "@/components/privacy/cookie-settings-link";
import { footerNav, siteConfig } from "@/config/site";
import { formatPhoneDisplay, telLink, whatsappLink } from "@/lib/format";
import type { SiteSettings } from "@/lib/queries/site-settings";
import { NewsletterForm } from "./newsletter-form";

const popularSearches = [
  { label: "Apartments for rent in Kileleshwa", href: "/rent?area=kileleshwa&type=apartment" },
  { label: "Apartments for rent in Westlands", href: "/rent?area=westlands&type=apartment" },
  { label: "Houses for sale in Lavington", href: "/buy?area=lavington&type=maisonette,townhouse,villa" },
  { label: "Homes for sale in Karen", href: "/buy?area=karen" },
  { label: "Furnished short stays in Kilimani", href: "/short-stays?area=kilimani" },
  { label: "Penthouses in Riverside", href: "/properties?area=riverside&type=penthouse" },
];

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

/** Site footer — always dark, with film grain. */
export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="dark grain relative overflow-hidden bg-ink text-ivory">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-gold/6 blur-3xl"
      />
      <div className="relative z-10 mx-auto max-w-[90rem] px-4 pt-20 pb-10 sm:px-6 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-12">
          {/* Brand + newsletter */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            <Logo tone="on-dark" variant="stacked" className="h-32" />
            <p className="max-w-md text-ivory/70 leading-relaxed">
              A Nairobi agency for people who care how home feels. Homes for sale, long-term
              rentals and furnished short stays — found, viewed and handled with care from our
              office in Kileleshwa.
            </p>
            <div className="mt-2 flex flex-col gap-3 rounded-(--radius-card) border border-hairline bg-ink-2/60 p-5 sm:p-6">
              <h2 className="font-display text-xl">New listings, first</h2>
              <p className="text-ivory/60 text-sm">
                Get hand-picked homes by email before they reach the portals.
              </p>
              <NewsletterForm />
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
            <FooterColumn title="Explore" links={footerNav.explore} />
            <FooterColumn title="Company" links={footerNav.company} />
            <div className="col-span-2 sm:col-span-1">
              <FooterColumn title="Popular searches" links={popularSearches} />
            </div>

            <div className="col-span-2 flex flex-col gap-4 sm:col-span-3">
              <p className="eyebrow">Talk to us</p>
              <ul className="grid gap-3 text-sm sm:grid-cols-2">
                <ContactItem icon={<PhoneIcon />} href={telLink(settings.phone)}>
                  {formatPhoneDisplay(settings.phone)}
                </ContactItem>
                <ContactItem
                  icon={<WhatsappLogoIcon />}
                  href={whatsappLink("Hi Sparks Properties, I'd like some help finding a property.", settings.whatsapp)}
                  external
                >
                  WhatsApp {formatPhoneDisplay(settings.whatsapp)}
                </ContactItem>
                <ContactItem icon={<EnvelopeSimpleIcon />} href={`mailto:${settings.email}`}>
                  {settings.email}
                </ContactItem>
                <ContactItem icon={<MapPinIcon />} href="/contact">
                  {settings.address}
                </ContactItem>
                <ContactItem icon={<ClockIcon />}>{settings.officeHours}</ContactItem>
              </ul>
              <SocialIcons hrefs={settings.social} className="mt-2" />
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-hairline border-t pt-6 text-ivory/50 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CopyrightYear /> {siteConfig.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {footerNav.legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-gold">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <CookieSettingsLink className="transition-colors hover:text-gold" />
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: readonly { label: string; href: string }[] }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="eyebrow">{title}</p>
      <ul className="flex flex-col gap-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-ivory/75 transition-colors duration-200 hover:text-gold-light">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactItem({
  icon,
  href,
  external,
  children,
}: {
  icon: ReactNode;
  href?: string;
  external?: boolean;
  children: ReactNode;
}) {
  const content = (
    <>
      <span aria-hidden="true" className="mt-0.5 text-gold [&_svg]:size-4.5">
        {icon}
      </span>
      <span>{children}</span>
    </>
  );
  return (
    <li>
      {href ? (
        <a
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="flex items-start gap-3 text-ivory/80 transition-colors hover:text-gold-light"
        >
          {content}
        </a>
      ) : (
        <span className="flex items-start gap-3 text-ivory/80">{content}</span>
      )}
    </li>
  );
}
