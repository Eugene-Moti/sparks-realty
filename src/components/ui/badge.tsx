import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/helpers/classname-helper";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full font-medium leading-none [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        neutral: "bg-foreground/8 text-foreground",
        gold: "border border-hairline bg-gold-400/12 text-accent",
        green: "bg-green-600 text-ivory",
        outline: "border border-border text-foreground",
        /** Over photos: dark glass. */
        glass: "bg-ink/60 text-ivory backdrop-blur-md",
        /** Status ribbons: Under offer / Sold / Let. */
        status: "bg-ivory text-ink shadow-soft",
        danger: "bg-danger text-ivory",
      },
      size: {
        sm: "h-6 px-2.5 text-[0.7rem]",
        md: "h-7 px-3 text-xs",
      },
      caps: {
        true: "uppercase tracking-[0.16em]",
        false: "",
      },
    },
    defaultVariants: { variant: "neutral", size: "md", caps: false },
  },
);

export type BadgeProps = ComponentPropsWithRef<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, size, caps, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size, caps }), className)} {...props} />;
}
