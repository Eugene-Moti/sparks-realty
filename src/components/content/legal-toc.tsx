"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { cn } from "@/helpers/classname-helper";

type Item = { id: string; text: string };

/** Scroll-spy: the last heading whose top has passed a line ~40% down the viewport. */
function useActiveHeading(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Below where anchor jumps land (Lenis offset + heading scroll-margin ≈ 300px).
        const line = Math.min(window.innerHeight * 0.45, 400);
        let current: string | null = null;
        for (const el of els) if (el.getBoundingClientRect().top <= line) current = el.id;
        // Short final sections can't reach the line: at the end of the article, prefer the last
        // heading that's on screen.
        const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        if (atEnd) {
          const visible = els.filter((el) => el.getBoundingClientRect().top < window.innerHeight);
          current = visible.at(-1)?.id ?? current;
        }
        setActive(current ?? els[0].id);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ids]);
  return active;
}

function Links({ items, active, onNavigate }: { items: Item[]; active: string | null; onNavigate?: () => void }) {
  return (
    <ol className="flex flex-col gap-0.5 text-sm">
      {items.map((it) => (
        <li key={it.id}>
          <a
            href={`#${it.id}`}
            onClick={onNavigate}
            aria-current={active === it.id ? "location" : undefined}
            className={cn(
              "-ml-px block border-l py-1.5 pl-4 leading-snug transition-colors",
              active === it.id ? "border-gold-600 text-foreground dark:border-gold" : "border-hairline text-muted hover:text-foreground",
            )}
          >
            {it.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Desktop: sticky sidebar list. Phones: a collapsible "On this page" panel. */
export function LegalToc({ items }: { items: Item[] }) {
  const [ids] = useState(() => items.map((i) => i.id));
  const active = useActiveHeading(ids);
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav aria-label="On this page" className="sticky top-28 hidden max-h-[calc(100dvh-8rem)] overflow-y-auto lg:block" data-lenis-prevent>
        <p className="eyebrow mb-4">On this page</p>
        <Links items={items} active={active} />
      </nav>

      <details
        open={open}
        onToggle={(e) => setOpen(e.currentTarget.open)}
        className="group rounded-2xl border border-hairline bg-surface lg:hidden"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-medium text-sm [&::-webkit-details-marker]:hidden">
          On this page
          <CaretDownIcon className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <nav aria-label="On this page" className="border-hairline border-t px-5 py-3">
          <Links items={items} active={active} onNavigate={() => setOpen(false)} />
        </nav>
      </details>
    </>
  );
}
