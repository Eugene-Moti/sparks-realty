"use client";

import { CookieIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import Link from "next/link";
import { useState } from "react";
import { duration, easeOut } from "@/components/motion/easing";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCookieConsent } from "@/lib/consent/cookie-consent";

/**
 * Cookie banner (Accept / Reject / Settings, equal prominence) + settings dialog.
 * Mounted once in the site layout. Nothing non-essential loads until "Accept".
 */
export function CookieBanner() {
  const { mounted, decided, settingsOpen, acceptAll, rejectAll, openSettings, closeSettings } =
    useCookieConsent();
  const reduce = useReducedMotion();
  const showBanner = mounted && !decided && !settingsOpen;

  return (
    <>
      <AnimatePresence>
        {showBanner ? (
          <motion.section
            key="cookie-banner"
            role="region"
            aria-label="Cookie consent"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: duration.slow, ease: easeOut }}
            className="dark fixed inset-x-3 bottom-3 z-60 mx-auto max-w-xl rounded-(--radius-card) border border-hairline bg-ink-2/95 p-5 text-ivory shadow-lift backdrop-blur-xl sm:inset-x-auto sm:left-6 sm:bottom-6 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <CookieIcon aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-gold" weight="duotone" />
              <div className="flex flex-col gap-1.5">
                <h2 className="font-display text-lg leading-tight">Your privacy, your choice</h2>
                {/* Short paragraphs on purpose: one long block can outgrow the hero headline and
                    become the page's LCP element, which then waits for JavaScript. */}
                <p className="text-ivory/75 text-sm leading-relaxed">
                  We use essential storage to run this site. With your permission we&apos;d also like
                  to use analytics to see which pages help people most.
                </p>
                <p className="text-ivory/75 text-sm leading-relaxed">
                  Videos only load when you press play.{" "}
                  <Link href="/privacy#9-cookies-and-similar-technologies" className="text-gold underline underline-offset-4">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <Button variant="gold-outline" size="sm" onClick={rejectAll}>
                Reject
              </Button>
              <Button variant="gold-outline" size="sm" onClick={openSettings}>
                Settings
              </Button>
              <Button variant="gold-outline" size="sm" onClick={acceptAll}>
                Accept
              </Button>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <CookieSettingsDialog open={settingsOpen} onOpenChange={(o) => (o ? openSettings() : closeSettings())} />
    </>
  );
}

function CookieSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { consent, save, closeSettings } = useCookieConsent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Keyed so the toggle re-reads the saved choice each time the dialog opens. */}
        {open ? (
          <CookieSettingsForm
            key={consent?.decidedAt ?? "new"}
            initialAnalytics={consent?.analytics ?? false}
            onSave={(analytics) => {
              save({ analytics });
              closeSettings();
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CookieSettingsForm({
  initialAnalytics,
  onSave,
}: {
  initialAnalytics: boolean;
  onSave: (analytics: boolean) => void;
}) {
  const [analytics, setAnalytics] = useState(initialAnalytics);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cookie settings</DialogTitle>
        <DialogDescription>
          Choose what we may use on this device. You can change this any time from &ldquo;Cookie
          settings&rdquo; at the bottom of every page.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col divide-y divide-border rounded-2xl border border-border">
        <SettingRow
          title="Essential"
          description="Keeps the site working: your theme, currency, favourites, compare list and this cookie choice. Stored only on your device."
          checked
          disabled
        />
        <SettingRow
          title="Analytics"
          description="Anonymous statistics about pages visited and buttons clicked (for example WhatsApp or Call), so we can improve the site. Off unless you turn it on."
          checked={analytics}
          onChange={setAnalytics}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <Button variant="gold-outline" onClick={() => onSave(false)}>
          Reject all
        </Button>
        <Button variant="gold-outline" onClick={() => onSave(true)}>
          Accept all
        </Button>
        <Button variant="solid" className="col-span-2" onClick={() => onSave(analytics)}>
          Save choices
        </Button>
      </div>
    </>
  );
}

function SettingRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  const id = `cookie-${title.toLowerCase()}`;
  return (
    <div className="flex items-start justify-between gap-4 p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="font-medium text-sm">
          {title}
          {disabled ? <span className="ml-2 text-muted text-xs">Always on</span> : null}
        </label>
        <p className="text-muted text-xs leading-relaxed">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className="group relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-foreground/15 transition-colors duration-200 aria-checked:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span
          aria-hidden="true"
          className="absolute top-0.5 left-0.5 size-5 rounded-full bg-ivory shadow-soft transition-transform duration-200 ease-(--ease-out-brand) group-aria-checked:translate-x-5"
        />
      </button>
    </div>
  );
}
