"use client";

import {
  CheckIcon,
  CopyIcon,
  EnvelopeSimpleIcon,
  FacebookLogoIcon,
  ShareNetworkIcon,
  WhatsappLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { Popover } from "radix-ui";
import { type MouseEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/helpers/classname-helper";

type ShareButtonProps = {
  url: string;
  title: string;
  /** Text for WhatsApp / email shares. */
  text: string;
  className?: string;
  variant?: "icon" | "full";
};

/**
 * Native share sheet on phones (Web Share API); elsewhere a small popover with
 * copy link, WhatsApp, Facebook, X and email. Share links open in a new tab;
 * nothing third-party loads on this page.
 */
export function ShareButton({ url, title, text, className, variant = "full" }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function onClick(e: MouseEvent) {
    if (typeof navigator !== "undefined" && "share" in navigator && window.matchMedia("(pointer: coarse)").matches) {
      e.preventDefault();
      try {
        await navigator.share({ title, text, url });
      } catch {
        // Cancelled by the visitor: nothing to do.
      }
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  const enc = encodeURIComponent;
  const targets = [
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(`${text} ${url}`)}`, icon: <WhatsappLogoIcon weight="fill" className="text-green-600 dark:text-green-400" /> },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, icon: <FacebookLogoIcon /> },
    { label: "X", href: `https://x.com/intent/post?text=${enc(title)}&url=${enc(url)}`, icon: <XLogoIcon /> },
    { label: "Email", href: `mailto:?subject=${enc(title)}&body=${enc(`${text}\n\n${url}`)}`, icon: <EnvelopeSimpleIcon /> },
  ];

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="ghost"
          size={variant === "icon" ? "icon" : "sm"}
          onClick={onClick}
          aria-label={variant === "icon" ? "Share this home" : undefined}
          className={cn(variant === "full" && "border border-border", className)}
        >
          <ShareNetworkIcon />
          {variant === "full" ? "Share" : null}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-60 rounded-2xl border border-hairline bg-surface p-2 text-foreground shadow-lift data-[state=open]:animate-fade-in"
        >
          <button
            type="button"
            onClick={copy}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-foreground/6 [&_svg]:size-4.5"
          >
            {copied ? <CheckIcon className="text-green-600" /> : <CopyIcon />}
            <span aria-live="polite">{copied ? "Link copied" : "Copy link"}</span>
          </button>
          {targets.map((t) => (
            <a
              key={t.label}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-foreground/6 [&_svg]:size-4.5"
            >
              {t.icon}
              {t.label}
            </a>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
