"use client";

import { ImageSquareIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/helpers/classname-helper";
import { prepareImage, storagePath, uploadFile } from "@/lib/admin/upload";
import { AvatarCropper, type SquareCrop } from "./avatar-cropper";

/**
 * Single image → site-media bucket (compressed WebP), stores the public URL.
 * `square` opens a crop step first (agent photos, testimonial avatars).
 */
export function ImageUpload({
  value,
  onChange,
  folder,
  label,
  hint,
  square = false,
  maxEdge,
  aspect = "aspect-[16/9]",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  label: string;
  hint?: string;
  square?: boolean;
  maxEdge?: number;
  aspect?: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);

  async function upload(file: File, crop?: SquareCrop) {
    try {
      setProgress(0);
      const prepared = await prepareImage(file, { maxEdge: maxEdge ?? (square ? 800 : 2400), square: crop });
      const { publicUrl } = await uploadFile("site-media", storagePath(folder, prepared.file), prepared.file, setProgress);
      onChange(publicUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setProgress(null);
    }
  }

  function onFile(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file.");
    if (square) setCropFile(file);
    else void upload(file);
  }

  return (
    <div className="flex flex-col gap-2">
      <span id={`${id}-label`} className="font-medium text-sm">
        {label}
      </span>
      <div className={cn("flex gap-4", square ? "items-center" : "flex-col")}>
        <div
          className={cn(
            "relative overflow-hidden border border-border bg-surface-2",
            square ? "size-28 shrink-0 rounded-full" : cn("w-full max-w-xl rounded-2xl", aspect),
          )}
        >
          {value ? (
            <Image src={value} alt="" fill sizes={square ? "112px" : "576px"} className="object-cover" />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-muted">
              <ImageSquareIcon className="size-8" />
            </span>
          )}
          {progress !== null ? (
            <span className="absolute inset-0 grid place-items-center bg-ink/60 font-mono text-ivory text-sm" aria-live="polite">
              {Math.round(progress * 100)}%
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="border border-border"
              disabled={progress !== null}
              onClick={() => inputRef.current?.click()}
              aria-describedby={`${id}-label`}
            >
              <UploadSimpleIcon /> {value ? "Replace" : "Upload"}
            </Button>
            {value ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
                <TrashIcon /> Remove
              </Button>
            ) : null}
          </div>
          {hint ? <p className="text-muted text-xs">{hint}</p> : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      {cropFile ? (
        <AvatarCropper
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onConfirm={(crop) => {
            const f = cropFile;
            setCropFile(null);
            void upload(f, crop);
          }}
        />
      ) : null}
    </div>
  );
}
