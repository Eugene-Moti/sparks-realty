"use client";

import { XIcon } from "@phosphor-icons/react";
import { Dialog as RadixDialog } from "radix-ui";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/helpers/classname-helper";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;
export const DialogPortal = RadixDialog.Portal;

export function DialogOverlay({
  className,
  ...props
}: ComponentPropsWithRef<typeof RadixDialog.Overlay>) {
  return (
    <RadixDialog.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-overlay backdrop-blur-[2px]",
        "data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out",
        className,
      )}
      {...props}
    />
  );
}

type DialogContentProps = ComponentPropsWithRef<typeof RadixDialog.Content> & {
  /** Hide the default close (×) button. */
  hideClose?: boolean;
};

export function DialogContent({ className, children, hideClose, ...props }: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <RadixDialog.Content
        data-lenis-prevent
        className={cn(
          "fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto",
          "rounded-(--radius-card) border border-hairline bg-surface p-6 text-foreground shadow-lift sm:p-8",
          "data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out",
          className,
        )}
        {...props}
      >
        {children}
        {hideClose ? null : (
          <RadixDialog.Close
            className="absolute top-4 right-4 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-foreground/6 hover:text-foreground"
            aria-label="Close"
          >
            <XIcon className="size-5" />
          </RadixDialog.Close>
        )}
      </RadixDialog.Content>
    </DialogPortal>
  );
}

export function DialogHeader({ className, ...props }: { className?: string; children: ReactNode }) {
  return <div className={cn("mb-5 flex flex-col gap-2 pr-8", className)} {...props} />;
}

export function DialogTitle({
  className,
  ...props
}: ComponentPropsWithRef<typeof RadixDialog.Title>) {
  return (
    <RadixDialog.Title
      className={cn("font-display text-2xl text-foreground leading-tight", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentPropsWithRef<typeof RadixDialog.Description>) {
  return (
    <RadixDialog.Description
      className={cn("text-muted text-sm leading-relaxed", className)}
      {...props}
    />
  );
}
