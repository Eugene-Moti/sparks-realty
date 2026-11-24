"use client";

import {
  ImageIcon,
  LinkSimpleIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  QuotesIcon,
  TextBIcon,
  TextHTwoIcon,
  TextItalicIcon,
} from "@phosphor-icons/react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Markdown } from "@/components/content/markdown";
import { controlClassName } from "@/components/ui/input";
import { cn } from "@/helpers/classname-helper";
import { prepareImage, storagePath, uploadFile } from "@/lib/admin/upload";

const TOOLS = [
  { id: "heading", label: "Heading", icon: <TextHTwoIcon /> },
  { id: "bold", label: "Bold", icon: <TextBIcon /> },
  { id: "italic", label: "Italic", icon: <TextItalicIcon /> },
  { id: "ul", label: "Bulleted list", icon: <ListBulletsIcon /> },
  { id: "ol", label: "Numbered list", icon: <ListNumbersIcon /> },
  { id: "quote", label: "Quote", icon: <QuotesIcon /> },
  { id: "link", label: "Link", icon: <LinkSimpleIcon /> },
] as const;

/**
 * Plain-textarea Markdown editor with a formatting toolbar, image upload
 * (site-media) and a Write / Preview toggle. Friendly for non-technical staff.
 */
export function MarkdownEditor({
  value,
  onChange,
  label,
  hint,
  error,
  rows = 16,
  imageFolder,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  hint?: string;
  error?: string;
  rows?: number;
  imageFolder?: string;
  placeholder?: string;
}) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState<number | null>(null);

  /** Wrap the selection (or insert a placeholder) and keep the cursor sensible. */
  function wrap(before: string, after = before, placeholderText = "text") {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = value.slice(s, e) || placeholderText;
    const next = value.slice(0, s) + before + selected + after + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + selected.length);
    });
  }

  /** Prefix each selected line (lists, headings, quotes). */
  function prefix(make: (i: number) => string) {
    const el = ref.current;
    if (!el) return;
    const start = value.lastIndexOf("\n", el.selectionStart - 1) + 1;
    const endIdx = value.indexOf("\n", el.selectionEnd);
    const end = endIdx === -1 ? value.length : endIdx;
    const block = value.slice(start, end) || "";
    const lines = block.split("\n").map((l, i) => make(i) + l.replace(/^(#{1,4}\s|[-*]\s|\d+\.\s|>\s?)/, ""));
    onChange(value.slice(0, start) + lines.join("\n") + value.slice(end));
    requestAnimationFrame(() => el.focus());
  }

  function insertAtCursor(text: string) {
    const el = ref.current;
    const pos = el?.selectionStart ?? value.length;
    const needsBreak = pos > 0 && value[pos - 1] !== "\n";
    onChange(`${value.slice(0, pos)}${needsBreak ? "\n\n" : ""}${text}\n\n${value.slice(pos)}`);
  }

  async function uploadImage(file: File) {
    if (!imageFolder) return;
    try {
      setUploading(0);
      const prepared = await prepareImage(file, { maxEdge: 1800 });
      const { publicUrl } = await uploadFile("site-media", storagePath(imageFolder, prepared.file), prepared.file, setUploading);
      const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      insertAtCursor(`![${alt}](${publicUrl})`);
      toast.success("Image added. Edit the text in [ ] to describe it.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  type Tool = "heading" | "bold" | "italic" | "ul" | "ol" | "quote" | "link";
  function apply(tool: Tool) {
    if (tool === "heading") prefix(() => "## ");
    else if (tool === "bold") wrap("**");
    else if (tool === "italic") wrap("*");
    else if (tool === "ul") prefix(() => "- ");
    else if (tool === "ol") prefix((i) => `${i + 1}. `);
    else if (tool === "quote") prefix(() => "> ");
    else {
      const url = window.prompt("Link address (https://…)", "https://");
      if (url && /^(https?:\/\/|\/)/.test(url)) wrap("[", `](${url})`, "link text");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <label htmlFor={id} className="font-medium text-sm">
          {label}
        </label>
        <div role="tablist" aria-label="Editor mode" className="flex rounded-full border border-border p-0.5 text-xs">
          {(["write", "preview"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn("rounded-full px-3 py-1 capitalize", mode === m ? "bg-ink text-ivory" : "text-muted hover:text-foreground")}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === "write" ? (
        <div className={cn("overflow-hidden rounded-(--radius-control) border bg-surface", error ? "border-danger" : "border-border")}>
          <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 border-border border-b bg-surface-2/50 p-1">
            {TOOLS.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => apply(t.id)}
                aria-label={t.label}
                title={t.label}
                className="grid size-8 place-items-center rounded-lg text-foreground/75 hover:bg-foreground/8 hover:text-foreground [&_svg]:size-4"
              >
                {t.icon}
              </button>
            ))}
            {imageFolder ? (
              <>
                <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading !== null}
                  className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-foreground/75 text-xs hover:bg-foreground/8 hover:text-foreground [&_svg]:size-4"
                >
                  <ImageIcon /> {uploading !== null ? `Uploading ${Math.round(uploading * 100)}%` : "Image"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadImage(f);
                    e.target.value = "";
                  }}
                />
              </>
            ) : null}
          </div>
          <textarea
            ref={ref}
            id={id}
            rows={rows}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={hint || error ? `${id}-hint` : undefined}
            className={cn(controlClassName, "min-h-60 resize-y rounded-none border-0 py-3 font-mono text-[0.85rem] leading-relaxed shadow-none focus-visible:ring-0")}
          />
        </div>
      ) : (
        <div className="min-h-60 rounded-(--radius-control) border border-border bg-background p-5">
          {value.trim() ? <Markdown source={value} /> : <p className="text-muted text-sm">Nothing to preview yet.</p>}
        </div>
      )}
      {error ? (
        <p id={`${id}-hint`} role="alert" className="font-medium text-danger text-xs">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-muted text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
