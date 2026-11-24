import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/config/site";

/**
 * /robots.txt. Preview deployments (any host other than NEXT_PUBLIC_SITE_URL's,
 * e.g. Vercel branch previews) are kept out of search by VERCEL_ENV below.
 */
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/preview/", "/favourites", "/compare", "/kitchen"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
