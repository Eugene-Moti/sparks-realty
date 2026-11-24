"use client";

import { siteConfig } from "@/config/site";

/**
 * Last-resort boundary (errors in the root layout). Replaces the whole document,
 * so it can't rely on fonts, theme or globals.css — inline styles only.
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en-KE">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0B0B0C",
          color: "#F6F3EC",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <main>
          <p style={{ letterSpacing: "0.3em", fontSize: 11, color: "#E0B458", textTransform: "uppercase" }}>Sparks Properties</p>
          <h1 style={{ fontWeight: 400, fontSize: 34, margin: "12px 0" }}>Sorry — something went wrong</h1>
          <p style={{ opacity: 0.7, maxWidth: 420, margin: "0 auto 24px", lineHeight: 1.6 }}>
            Please try again. If it keeps happening, WhatsApp us on {siteConfig.contact.whatsapp.display}.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => retry()}
              style={{ background: "#549638", color: "#fff", border: 0, borderRadius: 999, padding: "12px 22px", fontSize: 15, cursor: "pointer" }}
            >
              Try again
            </button>
            <a
              href={siteConfig.contact.whatsapp.href}
              style={{ border: "1px solid #E0B458", color: "#E0B458", borderRadius: 999, padding: "11px 22px", fontSize: 15, textDecoration: "none" }}
            >
              WhatsApp us
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
