import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import { WordReveal } from "@/components/motion/word-reveal";
import { DrawLine } from "./draw-line";
import { HeroBackground } from "./hero-background";
import { HeroSearch } from "./hero-search";

type HeroProps = {
  headline: string;
  subline: string;
  videoUrl: string | null;
  images: { src: string; alt: string }[];
  areas: { slug: string; name: string }[];
};

/** Homepage hero — always dark, full-bleed, with the search panel. */
export function Hero({ headline, subline, videoUrl, images, areas }: HeroProps) {
  return (
    <section
      aria-labelledby="hero-title"
      className="dark grain relative isolate flex min-h-svh flex-col overflow-hidden bg-ink text-ivory"
    >
      <HeroBackground images={images} videoUrl={videoUrl} />
      {/* Legibility: deep vignette from the bottom-left where the copy sits. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgb(11_11_12/0.55)_0%,rgb(11_11_12/0.15)_35%,rgb(11_11_12/0.55)_70%,rgb(11_11_12/0.92)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_15%_85%,rgb(11_11_12/0.7),transparent)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[90rem] flex-1 flex-col justify-end gap-10 px-4 pt-32 pb-14 sm:px-6 sm:pb-20 lg:px-10">
        <div className="flex max-w-4xl flex-col gap-6">
          <div className="flex items-center gap-4">
            <p className="eyebrow text-gold-200!">Sparks Properties · Nairobi</p>
            <DrawLine className="w-20 sm:w-28" />
          </div>
          <WordReveal
            id="hero-title"
            as="h1"
            trigger="mount"
            delay={0.2}
            text={headline}
            className="font-display text-[clamp(2.6rem,7vw,6rem)] leading-[0.98] tracking-[-0.02em] text-balance"
          />
          <p className="max-w-xl text-base text-ivory/80 leading-relaxed sm:text-lg">{subline}</p>
        </div>

        <HeroSearch areas={areas} />
      </div>

      <a
        href="#featured"
        className="relative z-10 mx-auto mb-6 hidden flex-col items-center gap-1 text-[0.65rem] text-ivory/50 uppercase tracking-[0.3em] transition-colors hover:text-gold sm:flex"
      >
        Scroll
        <CaretDownIcon className="size-4 animate-bounce motion-reduce:animate-none" />
      </a>
    </section>
  );
}
