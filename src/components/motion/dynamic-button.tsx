"use client";

import { CheckIcon, CircleNotchIcon, WarningCircleIcon } from "@phosphor-icons/react";
import type { VariantProps } from "class-variance-authority";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { type ComponentPropsWithRef, type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/helpers/classname-helper";
import { duration, easeOut } from "./easing";

export type DynamicButtonState = "idle" | "loading" | "success" | "error";

const defaultLabels: Record<DynamicButtonState, ReactNode> = {
  idle: "Send",
  loading: "Sending…",
  success: "Sent",
  error: "Try again",
};

const icons: Partial<Record<DynamicButtonState, ReactNode>> = {
  loading: <CircleNotchIcon weight="bold" className="animate-spin motion-reduce:animate-none" />,
  success: <CheckIcon weight="bold" />,
  error: <WarningCircleIcon weight="bold" />,
};

// Motion's button reuses these handler names with different signatures.
type ConflictingHandlers = "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart";

type DynamicButtonProps = Omit<ComponentPropsWithRef<"button">, "children" | ConflictingHandlers> &
  VariantProps<typeof buttonVariants> & {
    state?: DynamicButtonState;
    labels?: Partial<Record<DynamicButtonState, ReactNode>>;
    /** Optional icon shown with the idle label. */
    idleIcon?: ReactNode;
  };

/**
 * Submit button whose width smoothly follows its label:
 * Send → Sending… → Sent ✓ (or Try again). Used on every form.
 */
export function DynamicButton({
  state = "idle",
  labels,
  idleIcon,
  variant,
  size,
  className,
  disabled,
  type = "submit",
  ...props
}: DynamicButtonProps) {
  const reduce = useReducedMotion();
  const measureRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<number | "auto">("auto");
  const merged = { ...defaultLabels, ...labels };
  const icon = state === "idle" ? idleIcon : icons[state];

  // Measure the hidden copy of the current content, then animate to its width.
  useLayoutEffect(() => {
    const node = measureRef.current;
    if (!node) return;
    const update = () => setWidth(node.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const content = (
    <>
      {icon}
      <span>{merged[state]}</span>
    </>
  );

  return (
    <>
    <motion.button
      type={type}
      disabled={disabled || state === "loading"}
      aria-busy={state === "loading" || undefined}
      data-state={state}
      className={cn(
        buttonVariants({ variant, size }),
        "overflow-hidden px-0",
        state === "success" && variant !== "gold-outline" && "bg-green-600",
        state === "error" && "bg-danger text-ivory hover:bg-danger",
        className,
      )}
      animate={{ width }}
      initial={false}
      transition={{ duration: reduce ? 0 : duration.slow, ease: easeOut }}
      {...props}
    >
      {/* Invisible copy used only to measure the target width. */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute flex items-center gap-2 whitespace-nowrap px-6"
      >
        {content}
      </span>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={state}
          className="flex items-center gap-2 whitespace-nowrap px-6"
          initial={reduce ? false : { opacity: 0, y: 10, filter: "blur(2px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -10, filter: "blur(2px)" }}
          transition={{ duration: duration.ui, ease: easeOut }}
        >
          {content}
        </motion.span>
      </AnimatePresence>
    </motion.button>
    {/* Announce progress outside the button so its accessible name isn't doubled. */}
    <span className="sr-only" aria-live="polite">
      {state === "idle" ? "" : merged[state]}
    </span>
    </>
  );
}
