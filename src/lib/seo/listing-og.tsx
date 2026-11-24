/* eslint-disable @next/next/no-img-element -- next/og (satori) renders plain <img>, not next/image */
import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { formatPrice } from "@/lib/format";
import { listingTypeLabels, propertyTypeLabels, statusRibbons } from "@/lib/labels";
import { PROPERTIES_TAG } from "@/lib/queries/properties";
import { getPropertyBySlug } from "@/lib/queries/property-detail";

export const OG_SIZE = { width: 1200, height: 630 };
const LOGO_H = 72;
const LOGO_W = Math.round((LOGO_H * 1200) / 326);

// Local assets, read once (see the Next.js opengraph-image docs: "Node.js runtime with local assets").
const marcellus = readFile(join(process.cwd(), "src/assets/fonts/Marcellus-Regular.ttf"));
const logo = readFile(join(process.cwd(), "public/brand/logo-on-dark.png"), "base64").then(
  (b64) => `data:image/png;base64,${b64}`,
);

/**
 * Cover photo as a 1200×630 JPEG data URL. Converting with sharp means WebP
 * uploads work (the OG renderer can't read WebP) and the image is pre-cropped.
 */
async function coverDataUrl(src: string): Promise<string | null> {
  "use cache";
  cacheTag(PROPERTIES_TAG);
  cacheLife("days");
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const jpeg = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(OG_SIZE.width, OG_SIZE.height, { fit: "cover" })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch (err) {
    console.error("[og cover]", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Share card for WhatsApp / Facebook / X: cover photo, title, price, beds/baths, logo. */
export async function renderListingOg(slug: string): Promise<Response> {
  const [p, font, logoSrc] = await Promise.all([getPropertyBySlug(slug), marcellus, logo]);
  const cover = p?.images[0] ? await coverDataUrl(p.images[0].src) : null;

  const price = p ? formatPrice({ priceKes: p.priceKes, period: p.pricePeriod, priceOnRequest: p.priceOnRequest }).primary : "";
  const facts = p
    ? [
        p.bedrooms ? `${p.bedrooms} bed${p.bedrooms === 1 ? "" : "s"}` : null,
        p.bathrooms ? `${p.bathrooms} bath${p.bathrooms === 1 ? "" : "s"}` : null,
        p.floorArea ? `${Math.round(p.floorArea)} m²` : null,
        propertyTypeLabels[p.propertyType],
      ].filter(Boolean)
    : [];
  const ribbon = p ? statusRibbons[p.status] : undefined;

  const image = new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", background: "#0B0B0C", color: "#F6F3EC" }}>
      {cover ? (
        <img src={cover} alt="" width={1200} height={630} style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, objectFit: "cover" }} />
      ) : null}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1200,
          height: 630,
          display: "flex",
          backgroundImage: "linear-gradient(180deg, rgba(11,11,12,0.7) 0%, rgba(11,11,12,0.1) 26%, rgba(11,11,12,0.25) 42%, rgba(11,11,12,0.86) 66%, rgba(11,11,12,0.97) 100%)",
        }}
      />
      <div style={{ position: "absolute", top: 40, left: 56, right: 56, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <img src={logoSrc} alt="" width={LOGO_W} height={LOGO_H} />
        {ribbon ? (
          <div style={{ display: "flex", padding: "10px 24px", borderRadius: 999, background: "rgba(11,11,12,0.75)", fontSize: 22, letterSpacing: 6, textTransform: "uppercase" }}>
            {ribbon}
          </div>
        ) : null}
      </div>
      <div style={{ position: "absolute", left: 56, right: 56, bottom: 48, display: "flex", flexDirection: "column", gap: 14 }}>
        {p ? (
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 5, textTransform: "uppercase", color: "#E0B458" }}>
            {`${listingTypeLabels[p.listingType]}${p.area ? ` · ${p.area.name}` : ""}`}
          </div>
        ) : null}
        <div style={{ display: "flex", fontFamily: "Marcellus", fontSize: 58, lineHeight: 1.05, maxWidth: 1000 }}>
          {p?.title ?? "Sparks Properties"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 8, fontSize: 30 }}>
          {price ? <div style={{ display: "flex", color: "#F7D27A", fontWeight: 600 }}>{price}</div> : null}
          {facts.length ? <div style={{ display: "flex", color: "rgba(246,243,236,0.8)" }}>{facts.join("  ·  ")}</div> : null}
        </div>
      </div>
    </div>,
    { ...OG_SIZE, fonts: [{ name: "Marcellus", data: font, style: "normal", weight: 400 }] },
  );
  return toJpeg(image);
}

/**
 * next/og renders PNG (~850 KB with a photo). WhatsApp often drops link previews
 * whose image is that large, so re-encode as a ~100 KB JPEG, keeping next/og's cache headers.
 */
async function toJpeg(image: ImageResponse): Promise<Response> {
  const png = Buffer.from(await image.arrayBuffer());
  const jpeg = await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  const headers = new Headers(image.headers);
  headers.set("Content-Type", "image/jpeg");
  headers.delete("Content-Length");
  return new Response(new Uint8Array(jpeg), { status: image.status, headers });
}
