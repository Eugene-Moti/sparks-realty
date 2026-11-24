"use client";

import { type ReactNode, Suspense, use, useId } from "react";

/**
 * Defers hydration of below-the-fold sections until they approach the viewport.
 *
 * During the first page load, a component that suspends inside a Suspense
 * boundary keeps the server HTML on screen and React hydrates it later (selective
 * hydration). <Gate> suspends on a promise that resolves when the section is within
 * `rootMargin` of the viewport — or on the visitor's first click/tap/key (so link
 * navigations, which wait for suspended content, never stall), so the content is visible and readable at once —
 * links work natively, and a click on a not-yet-hydrated section makes React
 * hydrate it first and replay the event. On client-side navigations (no server
 * HTML in the DOM yet) it never suspends.
 *
 * Use for heavy client sections that start below the fold (homepage sections,
 * footer, the lower half of listing pages). Never wrap above-the-fold or LCP content.
 */

// Keyed by the server-rendered element (not the id string): useId values can repeat across
// pages, and Next keeps hidden copies of visited pages (React <Activity>) in the DOM.
const pending = new WeakMap<Element, Promise<void>>();
const done = new WeakSet<Element>();

/**
 * Resolves on the visitor's first interaction (or Back/Forward, or after the page
 * has sat idle for a while). Every waiting section also resolves on it, because a
 * navigation is a React transition and transitions wait for anything suspended:
 * a section still waiting to scroll into view would otherwise freeze link clicks.
 */
let interaction: Promise<void> | null = null;
function firstInteraction(): Promise<void> {
  if (interaction) return interaction;
  interaction = new Promise<void>((resolve) => {
    const events = ["pointerdown", "keydown", "touchstart", "popstate"] as const;
    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      for (const e of events) window.removeEventListener(e, fire, true);
      resolve();
    };
    for (const e of events) window.addEventListener(e, fire, { capture: true, passive: true });
    // Safety net: hydrate everything once the page has been quiet for a while.
    window.setTimeout(() => {
      if ("requestIdleCallback" in window) window.requestIdleCallback(fire, { timeout: 3000 });
      else fire();
    }, 12_000);
  });
  return interaction;
}

function whenVisible(id: string, rootMargin: string): Promise<void> | null {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return null;
  // The server HTML for this section, if it's on screen and not in a hidden (Activity) page.
  const el = [...document.querySelectorAll(`[data-hydrate-when-visible="${CSS.escape(id)}"]`)].find(
    (node) => node.childElementCount > 0 && (node.checkVisibility?.() ?? true),
  );
  // No server HTML (client navigation) → render normally.
  if (!el || done.has(el)) return null;
  const existing = pending.get(el);
  if (existing) return existing;
  const visible = new Promise<void>((resolve) => {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          resolve();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    firstInteraction().then(() => io.disconnect());
  });
  const promise = Promise.race([visible, firstInteraction()]);
  pending.set(el, promise);
  // Registered before React's own listener, so the retry render sees it as done.
  promise.then(() => done.add(el));
  return promise;
}

function Gate({ id, rootMargin, children }: { id: string; rootMargin: string; children: ReactNode }) {
  const promise = whenVisible(id, rootMargin);
  if (promise) use(promise);
  return <>{children}</>;
}

export function HydrateWhenVisible({
  children,
  rootMargin = "600px 0px",
  className,
}: {
  children: ReactNode;
  /** How early to hydrate before the section scrolls into view. */
  rootMargin?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div data-hydrate-when-visible={id} className={className}>
      <Suspense fallback={null}>
        <Gate id={id} rootMargin={rootMargin}>
          {children}
        </Gate>
      </Suspense>
    </div>
  );
}
