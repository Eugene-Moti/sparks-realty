"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { cn } from "@/helpers/classname-helper";
import { duration, easeOut } from "./easing";

type WordRevealProps = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  /** "mount" for the hero (plays on load); "inView" for section titles. */
  trigger?: "mount" | "inView";
  delay?: number;
  /** Seconds between words. */
  stagger?: number;
  id?: string;
};

/**
 * Headline revealed word-by-word through a mask. Screen readers get the plain
 * sentence; under reduced motion it renders as static text.
 */
export function WordReveal({
  text,
  as = "h2",
  className,
  trigger = "inView",
  delay = 0,
  stagger = 0.06,
  id,
}: WordRevealProps) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  const words = text.split(/\s+/).filter(Boolean);

  // On-load headlines (the hero) animate with CSS so the words paint from the first frame —
  // no wait for JavaScript. Words stay inline so the browser measures the headline as one
  // text block (it's the LCP element). Reduced motion: static.
  if (trigger === "mount") {
    const Tag = as;
    return (
      <Tag id={id} className={className}>
        {words.map((word, i) => (
          <span key={`${word}-${i}`}>
            <span
              className="animate-word-in motion-reduce:animate-none"
              style={{ animationDelay: `${Math.round((delay + i * stagger) * 1000)}ms` }}
            >
              {word}
            </span>
            {i < words.length - 1 ? " " : null}
          </span>
        ))}
      </Tag>
    );
  }

  if (reduce) {
    const Static = as;
    return (
      <Static id={id} className={className}>
        {text}
      </Static>
    );
  }

  const play = { whileInView: "visible" } as const;

  return (
    <Comp
      id={id}
      className={cn("[overflow-wrap:anywhere]", className)}
      aria-label={text}
      initial="hidden"
      viewport={{ once: true, amount: 0.6 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      {...play}
    >
      {words.map((word, i) => (
        <span
          // Words can repeat; the index keeps keys unique and is stable for a given text.
          key={`${word}-${i}`}
          aria-hidden="true"
          className="inline-flex overflow-hidden pb-[0.12em] align-bottom -mb-[0.12em]"
        >
          <motion.span
            className="inline-block will-change-transform"
            variants={{
              hidden: { y: "110%" },
              visible: { y: "0%", transition: { duration: duration.hero, ease: easeOut } },
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </Comp>
  );
}
