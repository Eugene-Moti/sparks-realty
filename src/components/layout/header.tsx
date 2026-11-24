"use client";

import { HeartIcon, ListIcon } from "@phosphor-icons/react";
import { LayoutGroup, motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Logo } from "@/components/brand/logo";
import { Magnetic } from "@/components/motion/magnetic";
import { duration, easeOut } from "@/components/motion/easing";
import { Button } from "@/components/ui/button";
import { mainNav, primaryCta } from "@/config/site";
import { cn } from "@/helpers/classname-helper";
import { useFavourites } from "@/lib/stores/favourites";
import { CurrencyToggle } from "./currency-toggle";
import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "./theme-toggle";

/** Routes whose top section is a full-bleed dark hero the header floats over. */
const OVERLAY_ROUTES = new Set(["/"]);

const SCROLL_THRESHOLD = 24;

function subscribeScroll(cb: () => void) {
  window.addEventListener("scroll", cb, { passive: true });
  return () => window.removeEventListener("scroll", cb);
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type HeaderProps = {
  whatsappNumber: string;
  phone: string;
  socials: { youtube: string; facebook: string; instagram: string; tiktok: string };
};

export function Header({ whatsappNumber, phone, socials }: HeaderProps) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > SCROLL_THRESHOLD,
    () => false,
  );
  const { count } = useFavourites();

  const overlay = OVERLAY_ROUTES.has(pathname);
  const transparent = overlay && !scrolled;

  return (
    <>
      <a
        href="#main"
        className="sr-only z-100 rounded-full bg-ink px-4 py-2 text-ivory focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <header
        className={cn(
          "inset-x-0 top-0 z-40 transition-[background-color,border-color,box-shadow] duration-300 ease-(--ease-out-brand)",
          overlay ? "fixed" : "sticky",
          transparent
            ? // Forced dark over the hero: ivory text, on-dark logo.
              "dark border-transparent border-b bg-linear-to-b from-ink/60 to-transparent text-ivory"
            : "glass border-hairline border-b text-foreground shadow-[0_10px_30px_-20px_rgb(11_11_12/0.35)]",
        )}
      >
        <div className="mx-auto flex h-18 max-w-[90rem] items-center gap-4 px-4 sm:px-6 lg:h-20 lg:px-10">
          <Logo priority className="h-8 sm:h-9 xl:h-10" />

          <nav aria-label="Main" className="ml-6 hidden flex-1 xl:block">
            <LayoutGroup id="main-nav">
              <ul className="flex items-center gap-1">
                {mainNav.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href} className="relative">
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative block px-3 py-2 font-medium text-[0.8rem] tracking-wide transition-colors duration-200",
                          active ? "text-accent" : "text-current/75 hover:text-current",
                        )}
                      >
                        {item.label}
                        {active ? (
                          <motion.span
                            layoutId="nav-underline"
                            className="absolute inset-x-3 -bottom-0.5 h-px bg-gold"
                            transition={{ duration: reduce ? 0 : duration.slow, ease: easeOut }}
                          />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </LayoutGroup>
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <CurrencyToggle className="hidden sm:inline-flex" />
            <ThemeToggle />
            <Link
              href="/favourites"
              aria-label={count > 0 ? `Favourites (${count})` : "Favourites"}
              className="relative grid size-10 place-items-center rounded-full transition-colors duration-200 hover:bg-current/8"
            >
              <HeartIcon className="size-5" weight={count > 0 ? "fill" : "regular"} />
              {count > 0 ? (
                <span className="absolute top-1 right-0.5 grid min-w-4.5 place-items-center rounded-full bg-green-600 px-1 font-mono text-[0.6rem] text-ivory leading-4.5">
                  {count > 99 ? "99+" : count}
                </span>
              ) : null}
            </Link>
            <Magnetic className="hidden md:inline-flex" strength={0.25}>
              <Button asChild size="md" className="ml-1">
                <Link href={primaryCta.href}>{primaryCta.label}</Link>
              </Button>
            </Magnetic>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="grid size-10 place-items-center rounded-full transition-colors duration-200 hover:bg-current/8 xl:hidden"
            >
              <ListIcon className="size-6" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        pathname={pathname}
        whatsappNumber={whatsappNumber}
        phone={phone}
        socials={socials}
      />
    </>
  );
}
