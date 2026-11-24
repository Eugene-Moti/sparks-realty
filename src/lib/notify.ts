import "server-only";

import { absoluteUrl } from "@/config/site";
import { enquiryKindLabels } from "@/lib/admin/labels";
import { getSiteSettings } from "@/lib/queries/site-settings";
import type { EnquiryKind } from "@/types/db";

type NewEnquiry = {
  id: string;
  kind: EnquiryKind;
  name: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  listing?: { title: string; ref: string | null } | null;
  details?: string | null;
};

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

/**
 * Email the office about a new enquiry via Resend (REST API, no SDK).
 * Skipped silently when RESEND_API_KEY isn't set. Never throws: a failed
 * alert must not lose the lead (it's already saved).
 */
export async function notifyNewEnquiry(e: NewEnquiry): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    const settings = await getSiteSettings();
    const to = process.env.ENQUIRY_ALERT_EMAIL || settings.email;
    const from = process.env.RESEND_FROM || "Sparks Properties Website <onboarding@resend.dev>";
    const kind = enquiryKindLabels[e.kind];
    const link = absoluteUrl(`/admin/enquiries?open=${e.id}`);
    const rows = [
      ["Name", e.name],
      ["Phone", e.phone],
      ["Email", e.email],
      ["Listing", e.listing ? `${e.listing.title}${e.listing.ref ? ` (${e.listing.ref})` : ""}` : null],
      ["Details", e.details],
      ["Message", e.message],
    ].filter((r): r is [string, string] => !!r[1]);

    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#0b0b0c">
<p style="margin:0 0 12px;color:#7e5e1c;letter-spacing:.2em;font-size:11px;text-transform:uppercase">New ${escape(kind)}</p>
<table cellpadding="6" style="border-collapse:collapse">${rows
      .map(([k, v]) => `<tr><td style="color:#67635d;vertical-align:top">${k}</td><td style="white-space:pre-wrap">${escape(v)}</td></tr>`)
      .join("")}</table>
<p style="margin:20px 0"><a href="${link}" style="background:#3e7a28;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">Open in the inbox</a></p>
<p style="color:#67635d;font-size:12px">Sent by the Sparks Properties website. Reply to the client from the inbox or WhatsApp.</p></div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `New ${kind.toLowerCase()}: ${e.name}${e.listing?.ref ? ` · ${e.listing.ref}` : ""}`,
        html,
        ...(e.email ? { reply_to: e.email } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("[notify] Resend responded", res.status, (await res.text()).slice(0, 200));
  } catch (err) {
    console.error("[notify]", err);
  }
}
