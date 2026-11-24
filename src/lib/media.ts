import type { PropertyMediaRow } from "@/types/db";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** Public URL of a file in a Supabase Storage bucket. */
export function storagePublicUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path.replace(/^\/+/, "")}`;
}

/** Resolve a property_media row to a URL (storage upload or external URL). */
export function mediaUrl(m: Pick<PropertyMediaRow, "storage_path" | "url">): string | null {
  if (m.storage_path) return storagePublicUrl("property-media", m.storage_path);
  return m.url ?? null;
}

export type ImageData = {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL: string | null;
  room: string | null;
};

/** Sorted images for a property: cover first, then by sort_order. */
export function propertyImages(media: PropertyMediaRow[] | null | undefined, fallbackAlt: string): ImageData[] {
  if (!media?.length) return [];
  return media
    .filter((m) => m.kind === "image")
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)
    .flatMap((m) => {
      const src = mediaUrl(m);
      if (!src) return [];
      return [
        {
          src,
          alt: m.alt || fallbackAlt,
          width: m.width ?? 2400,
          height: m.height ?? 1600,
          blurDataURL: m.blur_data,
          room: m.room_label,
        },
      ];
    });
}
