import { PageHero } from "@/components/layout/page-hero";
import type { LegalDoc } from "@/lib/legal";
import { LegalToc } from "./legal-toc";
import { Markdown } from "./markdown";

/** /privacy and /terms: header with dates, sticky contents, brand-styled Markdown. */
export function LegalPage({ doc, path }: { doc: LegalDoc; path: string }) {
  const meta = [
    doc.effectiveDate ? `Effective ${doc.effectiveDate}` : null,
    doc.lastUpdated ? `Last updated ${doc.lastUpdated}` : null,
    doc.odpcRegistrationNo ? `ODPC reg. ${doc.odpcRegistrationNo}` : null,
  ].filter(Boolean);

  return (
    <>
      <PageHero eyebrow="Legal" title={doc.title} crumbs={[{ name: doc.title, href: path }]}>
        {meta.length ? <p className="font-mono text-muted text-xs tracking-wide">{meta.join(" · ")}</p> : null}
      </PageHero>
      <div className="mx-auto grid w-full max-w-[90rem] gap-10 px-4 pb-24 sm:px-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16 lg:px-10">
        <aside className="lg:order-none">
          <LegalToc items={doc.toc} />
        </aside>
        <article className="min-w-0 max-w-3xl">
          <Markdown source={doc.body} anchors />
        </article>
      </div>
    </>
  );
}
