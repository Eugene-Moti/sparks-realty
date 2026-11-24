"use client";

import { ToggleGroup as RadixToggleGroup } from "radix-ui";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/helpers/classname-helper";

/**
 * Chip-style toggle group (single or multiple). Used for filters such as
 * bedrooms (Any/1/2/3/4/5+), amenities and the KES/USD switch.
 */
export function ToggleGroup({
  className,
  ...props
}: ComponentPropsWithRef<typeof RadixToggleGroup.Root>) {
  return (
    <RadixToggleGroup.Root
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

export const chipClassName = cn(
  "inline-flex h-9 select-none items-center justify-center gap-1.5 rounded-full border border-border px-4 font-medium text-sm",
  "text-foreground/80 transition-[background-color,border-color,color] duration-200 ease-(--ease-out-brand)",
  "hover:border-foreground/30 hover:text-foreground",
  "data-[state=on]:border-gold-600 data-[state=on]:bg-gold-400/12 data-[state=on]:text-accent",
  "dark:data-[state=on]:border-gold/70",
  "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
);

export function Chip({
  className,
  ...props
}: ComponentPropsWithRef<typeof RadixToggleGroup.Item>) {
  return <RadixToggleGroup.Item className={cn(chipClassName, className)} {...props} />;
}

/** Compact segmented control variant (e.g. KES | USD in the header). */
export function SegmentedGroup({
  className,
  ...props
}: ComponentPropsWithRef<typeof RadixToggleGroup.Root>) {
  return (
    <RadixToggleGroup.Root
      className={cn("inline-flex items-center rounded-full border border-border p-0.5", className)}
      {...props}
    />
  );
}

export function SegmentedItem({
  className,
  ...props
}: ComponentPropsWithRef<typeof RadixToggleGroup.Item>) {
  return (
    <RadixToggleGroup.Item
      className={cn(
        "inline-flex h-7 min-w-11 items-center justify-center rounded-full px-2.5 font-medium font-mono text-[0.7rem] tracking-wider",
        "text-current/70 transition-colors duration-200 hover:text-current",
        "data-[state=on]:bg-gold-400/15 data-[state=on]:text-accent",
        className,
      )}
      {...props}
    />
  );
}
