/**
 * URL of a photo resized by the Next.js image optimiser, for places that can't
 * use <Image> directly (lightbox srcSet). Widths must be in images.deviceSizes.
 */
export const LIGHTBOX_WIDTHS = [828, 1200, 1920, 2048] as const;

export function optimizedImageUrl(src: string, width: number, quality = 75): string {
  if (src.endsWith(".svg")) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}
