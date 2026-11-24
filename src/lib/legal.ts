import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import { headingId } from "@/components/content/markdown";

export type LegalDoc = {
  title: string;
  effectiveDate: string | null;
  lastUpdated: string | null;
  odpcRegistrationNo: string | null;
  /** Markdown body without the frontmatter and the leading "# Title" line. */
  body: string;
  /** "## " headings for the table of contents. */
  toc: { id: string; text: string }[];
};

const LEGAL_DIR = path.join(process.cwd(), "content", "legal");

/** "[DD Month 2026]"-style placeholders count as not filled in yet. */
const filled = (v: string | undefined) => (v && !/^\[.*\]$/.test(v.trim()) ? v.trim() : null);

/** Tiny frontmatter reader: `key: value` / `key: "value"` lines between --- fences. */
function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!m) return { data: {}, body: raw };
  const data: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (kv) data[kv[1]] = kv[2].trim().replace(/^(["'])(.*)\1$/, "$2");
  }
  return { data, body: raw.slice(m[0].length) };
}

/**
 * Reads content/legal/{name}.md (staff edit these files; the page never
 * duplicates their text). Built into the static page at deploy time.
 */
export async function getLegalDoc(name: "privacy-policy" | "terms"): Promise<LegalDoc> {
  "use cache";
  cacheLife("max");
  const raw = await readFile(path.join(LEGAL_DIR, `${name}.md`), "utf8");
  const { data, body } = parseFrontmatter(raw);
  const withoutTitle = body.replace(/^\s*#\s+[^\n]*\n/, "");
  const toc = [...withoutTitle.matchAll(/^##\s+(.+)$/gm)].map((h) => {
    const text = h[1].trim().replace(/\*\*|__|`/g, "");
    return { id: headingId(text), text };
  });
  return {
    title: data.title || (name === "terms" ? "Terms of Use" : "Privacy Policy"),
    effectiveDate: filled(data.effectiveDate),
    lastUpdated: filled(data.lastUpdated),
    odpcRegistrationNo: filled(data.odpcRegistrationNo),
    body: withoutTitle,
    toc,
  };
}
