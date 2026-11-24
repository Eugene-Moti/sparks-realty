"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import { type ReactNode, useId, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/helpers/classname-helper";

/**
 * Clamps long text to ~9 lines with a fade and a "Read more" toggle. The full
 * text is always in the HTML (good for SEO and screen readers); the button
 * only appears when the content actually overflows.
 */
export function ReadMore({ children, collapsedHeight = 260 }: { children: ReactNode; collapsedHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollHeight > collapsedHeight + 40);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [collapsedHeight]);

  const clamped = overflows && !expanded;

  return (
    <div className="flex flex-col gap-4">
      <div
        id={id}
        ref={ref}
        className={cn("relative overflow-hidden", clamped && "mask-b-from-40%")}
        style={clamped ? { maxHeight: collapsedHeight } : undefined}
      >
        {children}
      </div>
      {overflows ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1.5 self-start font-medium text-accent text-sm underline-offset-4 hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
          <CaretDownIcon weight="bold" className={cn("size-4 transition-transform duration-200", expanded && "rotate-180")} />
        </button>
      ) : null}
    </div>
  );
}
