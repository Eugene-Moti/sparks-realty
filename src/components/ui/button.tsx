import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/helpers/classname-helper";

export const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap font-medium",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-(--ease-out-brand)",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        /** Converting CTAs: WhatsApp, Book viewing, Submit. */
        "green-solid":
          "bg-green-600 text-ivory shadow-[0_10px_30px_-12px_rgb(62_122_40/0.7)] hover:bg-green-700 dark:hover:bg-green-500",
        /** Quiet luxury secondary action. */
        "gold-outline":
          "border border-gold-600/50 text-accent hover:border-gold-600 hover:bg-gold-400/8 dark:border-gold/45 dark:hover:border-gold",
        /** Ink/ivory solid for neutral primary actions. */
        solid:
          "bg-foreground text-background hover:bg-foreground/85",
        ghost: "text-foreground hover:bg-foreground/6",
        link: "h-auto! px-0! text-accent underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        sm: "h-9 rounded-full px-4 text-sm [&_svg]:size-4",
        md: "h-11 rounded-full px-5 text-sm [&_svg]:size-[1.125rem]",
        lg: "h-13 rounded-full px-7 text-base [&_svg]:size-5",
        icon: "size-10 rounded-full [&_svg]:size-5",
        "icon-sm": "size-8 rounded-full [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "green-solid", size: "md" },
  },
);

export type ButtonProps = ComponentPropsWithRef<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (e.g. a Link) with button styles. */
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      type={asChild ? type : (type ?? "button")}
      {...props}
    />
  );
}
