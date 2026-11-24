import { z } from "zod";
import { consentShape } from "./consent";

/**
 * "Save this search" → saved_searches. The alert for this search is the service
 * being requested (covered by the required consent); the separate marketing box
 * (property alerts and news beyond this search) stays optional.
 */
export const savedSearchSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }).max(254),
  /** The search as a URL query string, e.g. "listing=rent&area=kileleshwa". */
  query: z.string().max(1000),
  /** Page the search was saved from, e.g. "/rent". */
  path: z.string().max(100).regex(/^\/[a-z0-9/-]*$/),
  ...consentShape,
});

export type SavedSearchValues = z.infer<typeof savedSearchSchema>;
