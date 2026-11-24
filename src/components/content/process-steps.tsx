import { Reveal, RevealGroup } from "@/components/motion/reveal";

export type Step = { title: string; body: string };

/** Numbered timeline with a hairline spine (stagger-reveals on scroll). */
export function ProcessSteps({ steps, className }: { steps: Step[]; className?: string }) {
  return (
    <RevealGroup as="ol" className={className ?? "relative flex flex-col gap-8"}>
      {steps.map((s, i) => (
        <Reveal key={s.title} as="li" className="relative grid grid-cols-[3rem_minmax(0,1fr)] gap-5">
          {i < steps.length - 1 ? (
            <span aria-hidden="true" className="absolute top-12 bottom-[-2rem] left-6 w-px bg-linear-to-b from-gold-600/50 to-transparent dark:from-gold/40" />
          ) : null}
          <span className="relative grid size-12 place-items-center rounded-full border border-gold-600/40 bg-background font-mono text-accent text-sm dark:border-gold/40">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="flex flex-col gap-1.5 pt-2.5">
            <h3 className="font-display text-xl leading-snug">{s.title}</h3>
            <p className="text-muted text-sm leading-relaxed">{s.body}</p>
          </div>
        </Reveal>
      ))}
    </RevealGroup>
  );
}

/** Accessible FAQ list (native <details>), with FAQPage JSON-LD built by the caller. */
export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="flex flex-col divide-y divide-hairline border-hairline border-y">
      {items.map((f) => (
        <details key={f.q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 font-display text-xl leading-snug [&::-webkit-details-marker]:hidden">
            {f.q}
            <span aria-hidden="true" className="mt-1 grid size-7 shrink-0 place-items-center rounded-full border border-hairline text-accent transition-transform duration-300 group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 max-w-3xl text-muted leading-relaxed">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}
