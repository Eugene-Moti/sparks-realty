"use client";

import { AlertDialog, Switch as RadixSwitch } from "radix-ui";
import { createContext, type ReactNode, useCallback, useContext, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/helpers/classname-helper";

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow ? <p className="eyebrow text-accent">{eyebrow}</p> : null}
        <h1 className="text-3xl leading-tight sm:text-4xl">{title}</h1>
        {description ? <p className="max-w-2xl text-muted text-sm leading-relaxed">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  id,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("flex flex-col gap-5 rounded-(--radius-card) border border-hairline bg-surface p-5 shadow-soft sm:p-6", className)}>
      {title || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            {title ? <h2 className="font-display text-xl">{title}</h2> : null}
            {description ? <p className="text-muted text-sm">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-(--radius-card) border border-hairline border-dashed px-6 py-14 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/mark.svg" alt="" className="size-10 opacity-60" />
      <p className="font-display text-xl">{title}</p>
      {children ? <p className="max-w-md text-muted text-sm leading-relaxed">{children}</p> : null}
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status pills
// ---------------------------------------------------------------------------

const pillTones = {
  green: "bg-green-100 text-green-800",
  gold: "bg-gold-100 text-gold-800",
  ink: "bg-ink text-ivory",
  muted: "bg-foreground/8 text-foreground/70",
  danger: "bg-danger/12 text-danger",
  blue: "bg-[#e3ecf7] text-[#24456b]",
} as const;
export type PillTone = keyof typeof pillTones;

export function Pill({ tone = "muted", children, className }: { tone?: PillTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 font-medium text-xs", pillTones[tone], className)}>
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Switch
// ---------------------------------------------------------------------------

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  name,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  name?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="cursor-pointer font-medium text-sm">
          {label}
        </label>
        {description ? (
          <p id={`${id}-d`} className="text-muted text-xs leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      <RadixSwitch.Root
        id={id}
        name={name}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={description ? `${id}-d` : undefined}
        className="relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer rounded-full bg-foreground/15 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-green-600"
      >
        <RadixSwitch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow-soft transition-transform duration-200 will-change-transform data-[state=checked]:translate-x-[1.375rem]" />
      </RadixSwitch.Root>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirm dialog (promise-based): const confirm = useConfirm(); if (await confirm({...})) …
// ---------------------------------------------------------------------------

type ConfirmOptions = {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

const ConfirmContext = createContext<((o: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((o: ConfirmOptions) => {
    setOptions(o);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  };

  return (
    <ConfirmContext value={confirm}>
      {children}
      <AlertDialog.Root open={!!options} onOpenChange={(open) => !open && close(false)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm data-[state=open]:animate-fade-in" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-(--radius-card) border border-hairline bg-surface p-6 text-foreground shadow-lift data-[state=open]:animate-dialog-in">
            <AlertDialog.Title className="font-display text-2xl">{options?.title}</AlertDialog.Title>
            {options?.description ? (
              <AlertDialog.Description className="text-muted text-sm leading-relaxed">{options.description}</AlertDialog.Description>
            ) : (
              <AlertDialog.Description className="sr-only">Please confirm.</AlertDialog.Description>
            )}
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button variant="ghost" className="border border-border">
                  {options?.cancelLabel ?? "Cancel"}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  variant={options?.destructive ? "solid" : "green-solid"}
                  className={cn(options?.destructive && "bg-danger text-ivory hover:bg-danger/90")}
                  onClick={() => close(true)}
                >
                  {options?.confirmLabel ?? "Confirm"}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </ConfirmContext>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>.");
  return ctx;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-md border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[0.7rem]">{children}</kbd>;
}

/** Compact admin inputs: same control styles, 44px tall. */
export const adminControl = "h-11 text-sm";
