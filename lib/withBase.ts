// Route EVERY asset URL through this for project-subpath (GitHub Pages) deploys — GLB, useGLTF.preload,
// textures, HDRI, fetches, <img src>. A single bare "/models/x.glb" 404s under https://user.github.io/repo/.
// BASE comes from next.config's basePath via NEXT_PUBLIC_BASE_PATH; empty for root/custom-domain sites.
const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

export function withBase(path: string): string {
  if (!path || !path.startsWith("/")) return path;
  return BASE + path;
}
