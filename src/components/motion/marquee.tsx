import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/helpers/classname-helper";

type MarqueeProps = {
  children: ReactNode;
  /** Seconds per loop. */
  duration?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
  className?: string;
  /** Fade the edges into the background. */
  fade?: boolean;
};

/**
 * Infinite horizontal marquee (CSS-only, server-rendered). The duplicate track
 * is hidden from assistive tech. Under reduced motion it stops and the row can
 * be scrolled by hand.
 */
export function Marquee({
  children,
  duration = 40,
  reverse = false,
  pauseOnHover = true,
  className,
  fade = true,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        // Reduced motion: a static, wrapped list (no scroll area keyboard users can't reach).
        "group relative flex overflow-hidden motion-reduce:overflow-visible",
        fade && "mask-x-from-90% mask-x-to-100% motion-reduce:mask-none",
        className,
      )}
      style={{ "--marquee-duration": `${duration}s` } as CSSProperties}
    >
      <div
        className={cn(
          "flex w-max shrink-0 animate-marquee motion-reduce:w-full motion-reduce:shrink motion-reduce:animate-none",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
      >
        <div className="flex shrink-0 items-center motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center">{children}</div>
        <div className="flex shrink-0 items-center motion-reduce:hidden" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
