import { ArrowRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { AnimatedMark } from "@/components/motion/animated-mark";
import { Button } from "@/components/ui/button";

const LINKS = [
  { label: "Homes for sale", href: "/buy" },
  { label: "Homes to rent", href: "/rent" },
  { label: "Short stays", href: "/short-stays" },
  { label: "Area guides", href: "/areas" },
  { label: "Contact us", href: "/contact" },
];

/** Shared 404 content (inside the site chrome, and standalone for unknown URLs). */
export function NotFoundView() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-20 text-center sm:px-6">
      <AnimatedMark className="size-40 sm:size-52" title="Sparks Properties" />
      <p className="eyebrow">Error 404</p>
      <h1 className="text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05]">This address isn&apos;t on our books</h1>
      <p className="max-w-lg text-muted leading-relaxed">
        The page may have moved, or the home has been taken off the market. Try one of these instead — or tell us what you&apos;re
        looking for.
      </p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Button asChild variant="green-solid" size="lg">
          <Link href="/properties">
            <MagnifyingGlassIcon /> Search all homes
          </Link>
        </Button>
        <Button asChild variant="gold-outline" size="lg">
          <Link href="/">Back to the homepage</Link>
        </Button>
      </div>
      <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="inline-flex items-center gap-1 text-muted transition-colors hover:text-accent">
              {l.label} <ArrowRightIcon className="size-3" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
