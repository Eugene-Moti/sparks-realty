"use client";

import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { duration, easeOut } from "@/components/motion/easing";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/helpers/classname-helper";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const reduce = useReducedMotion();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative grid size-10 place-items-center overflow-hidden rounded-full transition-colors duration-200 hover:bg-current/8",
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={isDark ? "moon" : "sun"}
          initial={reduce ? false : { opacity: 0, rotate: -60, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, rotate: 60, scale: 0.6 }}
          transition={{ duration: duration.ui, ease: easeOut }}
          className="grid place-items-center"
        >
          {isDark ? <MoonIcon className="size-5" /> : <SunIcon className="size-5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
