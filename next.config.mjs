/** @type {import('next').NextConfig} */
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// For a GitHub Pages PROJECT site (https://user.github.io/repo) set BASE to '/repo'.
// For a user/root site or custom domain, leave it ''.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  // Static export -> drops a fully static site in ./out (deploy anywhere, incl. GitHub Pages).
  output: 'export',
  images: { unoptimized: true },        // required for static export
  basePath: BASE,
  assetPrefix: BASE ? `${BASE}/` : undefined,
  // pin the workspace root (multiple lockfiles exist on this machine) so tracing/resolution is correct.
  outputFileTracingRoot: __dirname,
  // three / drei ship modern ESM; transpiling avoids edge-case build issues.
  transpilePackages: ['three'],
  reactStrictMode: true,
};

export default nextConfig;
