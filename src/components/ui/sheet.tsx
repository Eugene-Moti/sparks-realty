"use client";

import { XIcon } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import { Dialog as RadixDialog } from "radix-ui";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/helpers/classname-helper";
import { DialogOverlay } from "./dialog";

export const Sheet = RadixDialog.Root;
export const SheetTrigger = RadixDialog.Trigger;
export const SheetClose = RadixDialog.Close;
export const SheetTitle = RadixDialog.Title;
export const SheetDescription = RadixDialog.Description;

const sheetVariants = cva(
  "fixed z-50 flex flex-col overflow-y-auto border-hairline bg-surface text-foreground shadow-lift",
  {
    variants: {
      side: {
        right:
          "inset-y-0 right-0 h-dvh w-[min(100vw,26rem)] border-l data-[state=open]:animate-sheet-in-right data-[state=closed]:animate-sheet-out-right",
        left:
          "inset-y-0 left-0 h-dvh w-[min(100vw,26rem)] border-r data-[state=open]:animate-sheet-in-left data-[state=closed]:animate-sheet-out-left",
        bottom:
          "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-(--radius-card-lg) border-t pb-[env(safe-area-inset-bottom)] data-[state=open]:animate-sheet-in-bottom data-[state=closed]:animate-sheet-out-bottom",
      },
    },
    defaultVariants: { side: "right" },
  },
);

type SheetContentProps = ComponentPropsWithRef<typeof RadixDialog.Content> &
  VariantProps<typeof sheetVariants> & { hideClose?: boolean };

/** Side/bottom panel (mobile filters, mobile menu, enquiry drawer). */
export function SheetContent({ className, children, side, hideClose, ...props }: SheetContentProps) {
  return (
    <RadixDialog.Portal>
      <DialogOverlay />
      <RadixDialog.Content
        data-lenis-prevent
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {side === "bottom" ? (
          <div aria-hidden="true" className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-foreground/15" />
        ) : null}
        {children}
        {hideClose ? null : (
          <RadixDialog.Close
            className="absolute top-4 right-4 grid size-10 place-items-center rounded-full text-muted transition-colors hover:bg-foreground/6 hover:text-foreground"
            aria-label="Close"
          >
            <XIcon className="size-5" />
          </RadixDialog.Close>
        )}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
