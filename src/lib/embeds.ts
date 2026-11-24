/** Parse video URLs pasted by staff into embeddable IDs. Pure functions (server + client). */

export type VideoPlatform = "youtube" | "tiktok" | "instagram" | "facebook";

export type ParsedVideo =
  | { platform: "youtube"; id: string; isShort: boolean }
  | { platform: "tiktok"; id: string }
  | { platform: "instagram"; kind: "p" | "reel" | "tv"; id: string }
  | { platform: "facebook"; url: string };

function safeUrl(raw: string): URL | null {
  try {
    return new URL(raw.trim());
  } catch {
    return null;
  }
}

const YT_ID = /^[\w-]{11}$/;

export function parseYouTube(raw: string): { id: string; isShort: boolean } | null {
  if (YT_ID.test(raw.trim())) return { id: raw.trim(), isShort: false };
  const url = safeUrl(raw);
  if (!url) return null;
  const host = url.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return YT_ID.test(id) ? { id, isShort: false } : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v && YT_ID.test(v)) return { id: v, isShort: false };
    const [, kind, id] = url.pathname.split("/");
    if (id && YT_ID.test(id) && ["shorts", "embed", "live", "v"].includes(kind)) {
      return { id, isShort: kind === "shorts" };
    }
  }
  return null;
}

export function parseVideoUrl(raw: string): ParsedVideo | null {
  const yt = parseYouTube(raw);
  if (yt) return { platform: "youtube", ...yt };

  const url = safeUrl(raw);
  if (!url) return null;
  const host = url.hostname.replace(/^www\.|^m\./, "");

  if (host.endsWith("tiktok.com")) {
    // https://www.tiktok.com/@user/video/7300000000000000000
    const match = url.pathname.match(/\/video\/(\d+)/);
    return match ? { platform: "tiktok", id: match[1] } : null;
  }
  if (host === "instagram.com") {
    const match = url.pathname.match(/^\/(p|reel|tv)\/([\w-]+)/);
    return match ? { platform: "instagram", kind: match[1] as "p" | "reel" | "tv", id: match[2] } : null;
  }
  if (host === "facebook.com" || host === "fb.watch") {
    return { platform: "facebook", url: url.toString() };
  }
  return null;
}

/** youtube-nocookie embed: no YouTube cookies until the visitor plays the video. */
export function youTubeEmbedUrl(id: string, autoplay = true): string {
  const params = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1" });
  if (autoplay) params.set("autoplay", "1");
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

/** Served through next/image, so the visitor's browser never contacts YouTube before clicking. */
export function youTubeThumbnail(id: string, quality: "hq" | "maxres" = "hq"): string {
  return `https://i.ytimg.com/vi/${id}/${quality === "maxres" ? "maxresdefault" : "hqdefault"}.jpg`;
}

export function embedUrlFor(video: ParsedVideo): string | null {
  switch (video.platform) {
    case "youtube":
      return youTubeEmbedUrl(video.id);
    case "tiktok":
      return `https://www.tiktok.com/embed/v2/${video.id}`;
    case "instagram":
      return `https://www.instagram.com/${video.kind}/${video.id}/embed`;
    case "facebook":
      return null; // Opened in a new tab instead of embedded.
  }
}

export const platformLabel: Record<VideoPlatform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
};
