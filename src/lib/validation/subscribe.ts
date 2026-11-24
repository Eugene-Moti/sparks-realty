import { z } from "zod";
import { consentShape } from "./consent";

export const NEWSLETTER_MARKETING_MESSAGE =
  "Tick “Send me property alerts and news” so we're allowed to email you.";

/**
 * Footer newsletter / new-listings signup. Its only purpose is sending alerts,
 * so here the marketing box must be ticked too (it still starts unticked).
 */
export const subscribeSchema = z
  .object({
    email: z.email({ error: "Enter a valid email address." }).max(254),
    ...consentShape,
  })
  .refine((v) => v.marketing_opt_in, {
    path: ["marketing_opt_in"],
    error: NEWSLETTER_MARKETING_MESSAGE,
  });

export type SubscribeValues = z.infer<typeof subscribeSchema>;
