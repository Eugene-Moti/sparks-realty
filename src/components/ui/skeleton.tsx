import type { ComponentPropsWithRef } from "react";
import { cn } from "@/helpers/classname-helper";

/** Loading placeholder with a soft gold-tinted shimmer (static under reduced motion). */
export function Skeleton({ className, ...props }: ComponentPropsWithRef<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-xl bg-foreground/6",
        "before:absolute before:inset-0 before:animate-shimmer before:bg-linear-to-r before:from-transparent before:via-gold-200/15 before:to-transparent before:content-['']",
        "motion-reduce:before:hidden",
        className,
      )}
      {...props}
    />
  );
}
