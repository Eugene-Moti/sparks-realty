"use client";

import { Tooltip as RadixTooltip } from "radix-ui";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/helpers/classname-helper";

export const TooltipProvider = RadixTooltip.Provider;

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: ComponentPropsWithRef<typeof RadixTooltip.Content>["side"];
  className?: string;
};

/** Short hint on hover/focus. Never put essential information only in a tooltip. */
export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  return (
    <RadixTooltip.Root delayDuration={250}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={8}
          className={cn(
            "z-50 max-w-64 rounded-xl border border-hairline bg-ink px-3 py-2 text-ivory text-xs leading-snug shadow-lift",
            "origin-(--radix-tooltip-content-transform-origin) data-[state=delayed-open]:animate-tooltip-in data-[state=instant-open]:animate-tooltip-in",
            className,
          )}
        >
          {content}
          <RadixTooltip.Arrow className="fill-ink" width={10} height={5} />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
