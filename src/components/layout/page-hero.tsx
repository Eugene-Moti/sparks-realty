import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/config/site";
import { cn } from "@/helpers/classname-helper";

export type Crumb = { name: string; href: string };

/** Visible breadcrumb trail + BreadcrumbList JSON-LD (Home is added automatically). */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const all = [{ name: "Home", href: "/" }, ...items];
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absoluteUrl(c.href) })),
        }}
      />
      <nav aria-label="Breadcrumb" className={cn("text-xs", className)}>
        <ol className="flex flex-wrap items-center gap-1.5">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={c.href} className="flex items-center gap-1.5">
                {last ? (
                  <span aria-current="page" className="opacity-90">
                    {c.name}
                  </span>
                ) : (
                  <>
                    <Link href={c.href} className="opacity-75 transition-opacity hover:opacity-100">
                      {c.name}
                    </Link>
                    <span aria-hidden="true" className="opacity-40">
                      /
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

/**
 * Header for content pages. `tone="dark"` is the editorial ink band (optional
 * background photo); `tone="plain"` sits on the page surface.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  crumbs,
  image,
  tone = "plain",
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  crumbs: Crumb[];
  image?: string | null;
  tone?: "dark" | "plain";
  children?: ReactNode;
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <header className={cn(dark && "dark grain relative isolate overflow-hidden bg-ink text-ivory", className)}>
      {dark && image ? <Image src={image} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-45" /> : null}
      {dark ? <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/60 to-ink/25" /> : null}
      <div
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-[90rem] flex-col gap-4 px-4 sm:px-6 lg:px-10",
          dark ? "min-h-[44vh] justify-end pt-24 pb-14" : "pt-10 pb-10 lg:pt-14",
        )}
      >
        <Breadcrumbs items={crumbs} />
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="max-w-4xl text-[clamp(2.4rem,5.5vw,4.5rem)] leading-[1.02]">{title}</h1>
        {description ? (
          <p className={cn("max-w-2xl leading-relaxed sm:text-lg", dark ? "text-ivory/75" : "text-muted")}>{description}</p>
        ) : null}
        {children}
      </div>
    </header>
  );
}
