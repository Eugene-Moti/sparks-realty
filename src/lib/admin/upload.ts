"use client";

import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { storagePublicUrl } from "@/lib/media";

export type Bucket = "property-media" | "site-media";

export type PreparedImage = {
  file: File;
  width: number;
  height: number;
  /** Tiny base64 placeholder for next/image (blurDataURL). */
  blurData: string | null;
};

const MAX_EDGE = 2400;

/** Resize to ≤2400px, convert to WebP (~0.82 quality), measure, and make a blur placeholder. */
export async function prepareImage(
  file: File,
  opts: { maxEdge?: number; square?: { x: number; y: number; size: number } } = {},
): Promise<PreparedImage> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} isn't an image.`);
  const source = opts.square ? await cropToSquare(file, opts.square, opts.maxEdge ?? 800) : file;
  const compressed = await imageCompression(source, {
    maxWidthOrHeight: opts.maxEdge ?? MAX_EDGE,
    fileType: "image/webp",
    initialQuality: 0.82,
    maxSizeMB: 2.5,
    useWebWorker: true,
  });
  const bitmap = await createImageBitmap(compressed);
  const { width, height } = bitmap;
  const blurData = makeBlur(bitmap);
  bitmap.close();
  const name = file.name.replace(/\.[^.]+$/, "") || "image";
  return { file: new File([compressed], `${name}.webp`, { type: "image/webp" }), width, height, blurData };
}

function makeBlur(bitmap: ImageBitmap): string | null {
  try {
    const w = 16;
    const h = Math.max(1, Math.round((bitmap.height / bitmap.width) * w));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvas.toDataURL("image/webp", 0.5);
  } catch {
    return null;
  }
}

/** Crop a square (in source pixels) and scale it to `size`. */
async function cropToSquare(file: File, crop: { x: number; y: number; size: number }, size: number): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't crop images.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, crop.x, crop.y, crop.size, crop.size, 0, 0, size, size);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
  if (!blob) throw new Error("Couldn't crop that image.");
  return new File([blob], file.name, { type: "image/webp" });
}

/**
 * Upload with progress (XHR to the Storage REST API; supabase-js has no
 * progress events). Uses the signed-in staff session, so RLS applies.
 */
export async function uploadFile(
  bucket: Bucket,
  path: string,
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<{ path: string; publicUrl: string }> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your session has ended. Please sign in again.");

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else if (xhr.status === 413) reject(new Error(`${file.name} is too large.`));
      else if (xhr.status === 403 || xhr.status === 401) reject(new Error("You don't have permission to upload here."));
      else reject(new Error(`Upload failed (${xhr.status}). Please try again.`));
    };
    xhr.onerror = () => reject(new Error("Upload failed — check your connection."));
    xhr.send(file);
  });
  onProgress?.(1);
  return { path, publicUrl: storagePublicUrl(bucket, path) };
}

/** Unique, readable storage name: "<folder>/<uuid>-<slugged name>.<ext>". */
export function storagePath(folder: string, file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const base = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${folder}/${crypto.randomUUID().slice(0, 8)}${base ? `-${base}` : ""}.${ext}`;
}
