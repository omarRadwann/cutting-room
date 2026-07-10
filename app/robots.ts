import type { MetadataRoute } from "next";

// Set NEXT_PUBLIC_SITE_URL at deploy (the live origin, e.g. https://user.github.io). The fallback is a
// flagged placeholder — don't ship it. BASE matches next.config's basePath for project-subpath deploys.
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com"; // REPLACE at deploy
const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

// Required by `output: export` — emit a static robots.txt at build time.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE}${BASE}/sitemap.xml`,
  };
}
