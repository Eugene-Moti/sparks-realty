/** Brand easing curves (CLAUDE.md "Motion principles"). */
export const easeOut = [0.23, 1, 0.32, 1] as const;
export const easeInOut = [0.77, 0, 0.175, 1] as const;

/** Seconds. UI: 160–250ms. Hero/page moments: 600–1200ms. */
export const duration = {
  fast: 0.16,
  ui: 0.22,
  slow: 0.25,
  reveal: 0.7,
  hero: 1.1,
} as const;
