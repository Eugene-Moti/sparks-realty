import { ArrowRightIcon, SealCheckIcon, VideoCameraIcon, CurrencyDollarIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { Reveal, RevealGroup } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: VideoCameraIcon,
    title: "Shortlist from anywhere",
    body: "Live video-call viewings at a time that suits your time zone, plus full filmed tours of every home.",
  },
  {
    icon: SealCheckIcon,
    title: "Verified and transparent",
    body: "Title searches, an independent advocate of your choice and clear, itemised costs before you commit.",
  },
  {
    icon: CurrencyDollarIcon,
    title: "Complete with confidence",
    body: "Guidance on transfers and payment schedules, and a local team that keeps you updated every week.",
  },
];

/** "Buying from abroad?" band — always dark. */
/** `image`: a staff-uploaded listing photo (from the homepage data); no photo → plain dark band. */
export function DiasporaBand({ usdRate, image }: { usdRate: number; image?: string | null }) {
  return (
    <section aria-labelledby="diaspora-title" className="dark grain relative isolate overflow-hidden bg-ink text-ivory">
      {image ? <Image src={image} alt="" fill sizes="100vw" className="-z-10 object-cover opacity-30" /> : null}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-ink via-ink/85 to-ink/40" />

      <div className="relative z-10 mx-auto grid max-w-[90rem] gap-14 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:gap-20 lg:px-10 lg:py-32">
        <Reveal className="flex flex-col gap-6">
          <p className="eyebrow">Diaspora</p>
          <h2 id="diaspora-title" className="text-[clamp(2.2rem,4.5vw,3.5rem)] leading-[1.05]">
            Buying from abroad?
            <br />
            <span className="text-gold-gradient">We&apos;ll be your eyes in Nairobi.</span>
          </h2>
          <p className="max-w-lg text-ivory/75 leading-relaxed">
            Whether you&apos;re in London, Dubai, Houston or Doha, we help Kenyans abroad buy and
            let homes with the same care as if you were here.
          </p>
          <p className="max-w-lg rounded-2xl border border-hairline bg-ivory/4 px-4 py-3 font-mono text-ivory/70 text-xs leading-relaxed">
            Prices are listed in KES with a USD guide at KES {usdRate.toFixed(2)} = $1. Switch to
            USD any time from the top of the page.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="/contact?intent=video-viewing">
                <VideoCameraIcon /> Book a video-call viewing
              </Link>
            </Button>
            <Button asChild variant="gold-outline" size="lg">
              <Link href="/diaspora">
                How it works <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </Reveal>

        <RevealGroup as="ol" className="flex flex-col gap-4 self-center">
          {STEPS.map((s, i) => (
            <Reveal
              key={s.title}
              as="li"
              className="flex gap-5 rounded-(--radius-card) border border-hairline bg-ink-2/70 p-6 backdrop-blur-sm"
            >
              <span className="font-mono text-gold text-sm">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex flex-col gap-2">
                <h3 className="flex items-center gap-2 font-display text-xl">
                  <s.icon aria-hidden="true" className="size-5 text-gold" />
                  {s.title}
                </h3>
                <p className="text-ivory/70 text-sm leading-relaxed">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
