import type { ReactNode } from "react";
import { ClickToLoadEmbed } from "@/components/privacy/click-to-load-embed";
import { cn } from "@/helpers/classname-helper";
import { parseVideoUrl } from "@/lib/embeds";

/**
 * Small, safe Markdown renderer for staff-written content (posts, area
 * guides, policies). Builds React elements — never raw HTML — so pasted
 * <script> or on* attributes are shown as text, not executed.
 *
 * Supports: ## / ### / #### headings, paragraphs, - and 1. lists,
 * > quotes, --- rules, | tables |, ![alt](src) images on their own line,
 * a YouTube / TikTok / Instagram link on its own line (click-to-load video),
 * **bold**, *italic*, `code` and [links](https://…).
 */
/** `anchors`: show a "#" link beside ## / ### headings (long documents like policies). */
export function Markdown({ source, className, anchors = false }: { source: string; className?: string; anchors?: boolean }) {
  return <div className={cn("md flex flex-col gap-5 text-[1.05rem] text-foreground/85 leading-relaxed", className)}>{renderBlocks(source, anchors)}</div>;
}

type Block =
  | { t: "h"; level: 2 | 3 | 4; text: string }
  | { t: "p"; text: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "quote"; text: string }
  | { t: "hr" }
  | { t: "img"; alt: string; src: string }
  | { t: "embed"; url: string }
  | { t: "table"; head: string[]; rows: string[][] };

export function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = Math.min(4, Math.max(2, heading[1].length)) as 2 | 3 | 4;
      blocks.push({ t: "h", level, text: heading[2].trim() });
      i++;
      continue;
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      blocks.push({ t: "hr" });
      i++;
      continue;
    }
    const img = /^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/.exec(line.trim());
    if (img) {
      blocks.push({ t: "img", alt: img[1], src: img[2] });
      i++;
      continue;
    }
    const bare = line.trim();
    if (/^https:\/\/\S+$/.test(bare) && parseVideoUrl(bare)) {
      blocks.push({ t: "embed", url: bare });
      i++;
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      const cells = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(cells(lines[i++]));
      blocks.push({ t: "table", head, rows });
      continue;
    }
    if (/^\s*[-*•]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const re = ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*•]\s+/;
      const items: string[] = [];
      while (i < lines.length && re.test(lines[i])) {
        let item = lines[i].replace(re, "");
        i++;
        // Indented continuation lines belong to the item.
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !re.test(lines[i])) item += ` ${lines[i++].trim()}`;
        items.push(item);
      }
      blocks.push({ t: ordered ? "ol" : "ul", items });
      continue;
    }
    if (/^>\s?/.test(line)) {
      const parts: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) parts.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push({ t: "quote", text: parts.join("\n") });
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|>\s?|\s*[-*•]\s+|\s*\d+[.)]\s+|!\[)/.test(lines[i])) para.push(lines[i++]);
    if (!para.length) para.push(lines[i++]);
    blocks.push({ t: "p", text: para.join("\n") });
  }
  return blocks;
}

/** "## Why people love it" → "why-people-love-it" (anchor ids for a table of contents). */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[*_`[\]()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function renderBlocks(source: string, anchors = false): ReactNode[] {
  return parseBlocks(source).map((b, i) => {
    switch (b.t) {
      case "h": {
        const Tag = `h${b.level}` as "h2" | "h3" | "h4";
        const id = headingId(b.text);
        return (
          <Tag
            key={i}
            id={id}
            className={cn(
              "group/h scroll-mt-28 font-display text-foreground leading-tight",
              b.level === 2 ? "mt-4 text-[1.75rem]" : b.level === 3 ? "mt-2 text-xl" : "text-lg",
            )}
          >
            {inline(b.text)}
            {anchors && b.level < 4 ? (
              <a
                href={`#${id}`}
                aria-label={`Link to this section`}
                className="ml-2 align-middle font-sans text-[0.6em] text-accent opacity-0 transition-opacity focus-visible:opacity-100 group-hover/h:opacity-100"
              >
                #
              </a>
            ) : null}
          </Tag>
        );
      }
      case "ul":
        return (
          <ul key={i} className="flex list-disc flex-col gap-2 pl-5 marker:text-accent">
            {b.items.map((it, j) => (
              <li key={j}>{inline(it)}</li>
            ))}
          </ul>
        );
      case "ol":
        return (
          <ol key={i} className="flex list-decimal flex-col gap-2 pl-5 marker:font-mono marker:text-accent marker:text-sm">
            {b.items.map((it, j) => (
              <li key={j}>{inline(it)}</li>
            ))}
          </ol>
        );
      case "quote":
        return (
          <blockquote key={i} className="border-gold-600 border-l-2 pl-5 font-display text-foreground text-xl leading-snug dark:border-gold">
            {inline(b.text)}
          </blockquote>
        );
      case "hr":
        return <hr key={i} className="border-hairline" />;
      case "img":
        return safeUrl(b.src) ? (
          <figure key={i} className="flex flex-col gap-2">
            {/* Staff images from our storage or any https host; next/image needs known sizes. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.src} alt={b.alt} loading="lazy" className="w-full rounded-(--radius-card) border border-hairline" />
            {b.alt ? <figcaption className="text-center text-muted text-sm">{b.alt}</figcaption> : null}
          </figure>
        ) : null;
      case "embed":
        // Poster first; nothing loads from the platform until the reader presses play.
        return <ClickToLoadEmbed key={i} url={b.url} title="Video" className="max-w-none" />;
      case "table":
        return (
          <div key={i} className="overflow-x-auto rounded-2xl border border-hairline">
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              <thead className="bg-surface-2/70">
                <tr>
                  {b.head.map((h, j) => (
                    <th key={j} scope="col" className="border-hairline border-b px-4 py-3 font-medium text-foreground">
                      {inline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, j) => (
                  <tr key={j} className="border-hairline border-b align-top last:border-0 even:bg-surface-2/40">
                    {r.map((c, k) => (
                      <td key={k} className="px-4 py-3">
                        {inline(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return (
          <p key={i}>
            {b.text.split("\n").map((l, j) => (
              <span key={j}>
                {j > 0 ? <br /> : null}
                {inline(l)}
              </span>
            ))}
          </p>
        );
    }
  });
}

/** Only http(s), mailto:, tel: and site-relative links. */
function safeUrl(href: string): boolean {
  return /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(href);
}

const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

export function inline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="rounded bg-foreground/8 px-1.5 py-0.5 font-mono text-[0.9em]">{part.slice(1, -1)}</code>;
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const [, label, href] = link;
      if (!safeUrl(href)) return label;
      const external = /^https?:\/\//i.test(href);
      return (
        <a
          key={i}
          href={href}
          className="text-accent underline decoration-1 underline-offset-4 hover:decoration-2"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {label}
        </a>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}
