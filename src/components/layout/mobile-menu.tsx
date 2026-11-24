"use client";

import { PhoneIcon, WhatsappLogoIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import Link from "next/link";
import { Dialog as RadixDialog } from "radix-ui";
import { Logo } from "@/components/brand/logo";
import { SocialIcons } from "@/components/brand/social-icons";
import { duration, easeOut } from "@/components/motion/easing";
import { Button } from "@/components/ui/button";
import { mainNav, primaryCta } from "@/config/site";
import { cn } from "@/helpers/classname-helper";
import { telLink, whatsappLink } from "@/lib/format";
import { CurrencyToggle } from "./currency-toggle";
import { ThemeToggle } from "./theme-toggle";

type MobileMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
  whatsappNumber: string;
  phone: string;
  socials: { youtube: string; facebook: string; instagram: string; tiktok: string };
};

/** Full-screen menu (always dark) with staggered links, contacts and socials. */
export function MobileMenu({ open, onOpenChange, pathname, whatsappNumber, phone, socials }: MobileMenuProps) {
  const reduce = useReducedMotion();
  const close = () => onOpenChange(false);

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Content
              forceMount
              asChild
              aria-describedby={undefined}
              id="mobile-menu"
              data-lenis-prevent
            >
              <motion.div
                className="dark grain fixed inset-0 z-50 flex flex-col overflow-y-auto bg-ink text-ivory"
                initial={reduce ? { opacity: 0 } : { opacity: 0, clipPath: "inset(0 0 100% 0)" }}
                animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, clipPath: "inset(0 0 100% 0)" }}
                transition={{ duration: reduce ? duration.fast : 0.5, ease: easeOut }}
              >
                <RadixDialog.Title className="sr-only">Menu</RadixDialog.Title>
                <div className="relative z-10 flex h-18 items-center justify-between px-4 sm:px-6">
                  <Logo tone="on-dark" className="h-8" href={null} />
                  <RadixDialog.Close
                    aria-label="Close menu"
                    className="grid size-11 place-items-center rounded-full border border-hairline transition-colors hover:border-gold hover:text-gold"
                  >
                    <XIcon className="size-5" />
                  </RadixDialog.Close>
                </div>

                <nav aria-label="Mobile" className="relative z-10 flex-1 px-6 pt-6 sm:px-10">
                  <motion.ul
                    className="flex flex-col"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: reduce ? 0 : 0.045, delayChildren: reduce ? 0 : 0.15 } },
                    }}
                  >
                    {mainNav.map((item, i) => {
                      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      return (
                        <motion.li
                          key={item.href}
                          variants={{
                            hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 24 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
                          }}
                          className="border-hairline border-b"
                        >
                          <Link
                            href={item.href}
                            onClick={close}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex items-baseline justify-between py-3.5 font-display text-[clamp(1.75rem,7vw,2.5rem)] leading-none transition-colors",
                              active ? "text-gold" : "text-ivory hover:text-gold-light",
                            )}
                          >
                            {item.label}
                            <span className="font-mono text-[0.65rem] text-ivory/35 tracking-widest">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                          </Link>
                        </motion.li>
                      );
                    })}
                  </motion.ul>
                </nav>

                <motion.div
                  className="relative z-10 flex flex-col gap-6 px-6 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-10"
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: easeOut, delay: reduce ? 0 : 0.45 }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Button asChild variant="green-solid" size="lg">
                      <a href={whatsappLink("Hi Sparks Properties, I'd like some help finding a property.", whatsappNumber)} target="_blank" rel="noopener noreferrer">
                        <WhatsappLogoIcon weight="fill" /> WhatsApp
                      </a>
                    </Button>
                    <Button asChild variant="gold-outline" size="lg">
                      <a href={telLink(phone)}>
                        <PhoneIcon /> Call us
                      </a>
                    </Button>
                  </div>
                  <Button asChild variant="gold-outline" size="lg">
                    <Link href={primaryCta.href} onClick={close}>
                      {primaryCta.label}
                    </Link>
                  </Button>
                  <div className="flex items-center justify-between gap-4">
                    <SocialIcons hrefs={socials} />
                    <div className="flex items-center gap-1">
                      <CurrencyToggle />
                      <ThemeToggle />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        ) : null}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
