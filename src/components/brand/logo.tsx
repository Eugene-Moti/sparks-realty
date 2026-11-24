import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/helpers/classname-helper";

/**
 * Logo layouts (files in public/brand, from the brand pack in public/logo):
 * - compact: horizontal mark + wordmark, no tagline (headers, menus) — the tagline is unreadable that small
 * - full:    horizontal with "Your trusted real estate company"
 * - stacked: mark above wordmark + tagline (footer, about)
 */
const VARIANTS = {
  compact: { file: "logo-compact", aspect: "aspect-[1150/206]" },
  full: { file: "logo", aspect: "aspect-[1216/330]" },
  stacked: { file: "logo-stacked", aspect: "aspect-[1500/900]" },
} as const;

type LogoProps = {
  className?: string;
  /** Force a variant; by default it follows the (local) theme via the `dark` class. */
  tone?: "auto" | "on-dark" | "on-light";
  variant?: keyof typeof VARIANTS;
  priority?: boolean;
  href?: string | null;
};

/**
 * Sparks Properties logo. Renders both tones and lets CSS pick one, so it is
 * correct on first paint in either theme and inside forced-dark sections.
 */
export function Logo({ className, tone = "auto", variant = "compact", priority, href = "/" }: LogoProps) {
  const { file, aspect } = VARIANTS[variant];
  const img = (
    <span className={cn("relative block h-10", aspect, className)}>
      {tone !== "on-dark" ? (
        <Image
          src={`/brand/${file}-on-light.svg`}
          alt={tone === "on-light" ? siteConfig.name : ""}
          fill
          priority={priority}
          unoptimized
          className={cn("object-contain", tone === "auto" && "dark:hidden")}
        />
      ) : null}
      {tone !== "on-light" ? (
        <Image
          src={`/brand/${file}-on-dark.svg`}
          alt={tone === "on-dark" ? siteConfig.name : ""}
          fill
          priority={priority}
          unoptimized
          className={cn("object-contain", tone === "auto" && "hidden dark:block")}
        />
      ) : null}
      {tone === "auto" ? <span className="sr-only">{siteConfig.name}</span> : null}
    </span>
  );

  if (!href) return img;
  return (
    <Link href={href} aria-label={`${siteConfig.name} — home`} className="inline-flex shrink-0">
      {img}
    </Link>
  );
}
