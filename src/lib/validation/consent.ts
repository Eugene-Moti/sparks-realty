import { z } from "zod";

export const CONSENT_LABEL =
  "I agree to Sparks Properties processing my details to respond to this enquiry, as set out in the Privacy Policy";
export const MARKETING_LABEL = "Send me property alerts and news";
export const CONSENT_REQUIRED_MESSAGE =
  "Please tick this box so we can use your details to reply to you.";

/**
 * Shared zod fragment for every public form (client and server).
 * Maps 1:1 to the `consent_given` / `marketing_opt_in` columns on `enquiries`
 * and `saved_searches`. `consent_at` is stamped by the database.
 *
 *   const schema = z.object({ ...fields }).extend(consentShape)
 */
export const consentShape = {
  consent_given: z.boolean().refine((v) => v === true, { error: CONSENT_REQUIRED_MESSAGE }),
  marketing_opt_in: z.boolean(),
};

export const consentSchema = z.object(consentShape);
export type ConsentValues = z.infer<typeof consentSchema>;

/** Unticked defaults (the marketing box must never be pre-ticked). */
export const consentDefaults: ConsentValues = {
  consent_given: false,
  marketing_opt_in: false,
};

/** Honeypot field name shared by forms and route handlers. */
export const HONEYPOT_FIELD = "company_website";
