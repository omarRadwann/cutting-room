import type { MetadataRoute } from "next";

// Set NEXT_PUBLIC_SITE_URL at deploy; the fallback is a flagged placeholder — don't ship it.
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com"; // REPLACE at deploy
const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

// Required by `output: export` — emit a static sitemap.xml at build time.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // One entry for a single-page experience. Add a row per route for multi-page sites.
  return [{ url: `${SITE}${BASE}/`, changeFrequency: "monthly", priority: 1 }];
}
