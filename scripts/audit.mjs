#!/usr/bin/env node
/**
 * Static-build auditor — zero dependencies. Run AFTER `npm run build` (output in ./out).
 *
 *   node scripts/audit.mjs            # audits ./out against the award budget
 *   node scripts/audit.mjs ./out 15   # custom dir + custom initial-payload budget (MB)
 *
 * Turns the perf/deploy budget from prose (perf-a11y-checklist.md) into a pass/fail gate.
 * Exits 1 on any FAIL so CI / a pre-deploy step can block. Checks:
 *   • out/.nojekyll exists           (GitHub Pages drops _next/* without it → blank site)
 *   • total + largest assets         (initial 3D payload budget < ~12–15MB behind the preloader)
 *   • uncompressed heavy assets      (raw .glb / multi-MB .png → the gltf-transform/KTX2 step didn't run)
 *   • un-prefixed absolute asset URLs in HTML (subpath-deploy 404 risk → route through withBase())
 */
import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const OUT = process.argv[2] || "out";
const PAYLOAD_BUDGET_MB = Number(process.argv[3] || 15);

const RED = "\x1b[31m", GRN = "\x1b[32m", YEL = "\x1b[33m", DIM = "\x1b[2m", RST = "\x1b[0m";
const mb = (b) => (b / 1024 / 1024).toFixed(2) + "MB";
const kb = (b) => (b / 1024).toFixed(0) + "KB";

if (!existsSync(OUT)) {
  console.error(`${RED}✗ "${OUT}" not found. Run \`npm run build\` first.${RST}`);
  process.exit(1);
}

// thresholds (bytes)
const GLB_WARN = 10 * 1024 * 1024;   // a single hero glb should be < ~10MB compressed
const IMG_WARN = 2 * 1024 * 1024;    // a single raster > 2MB usually means it wasn't compressed/KTX2'd
const HEAVY = [".glb", ".gltf", ".png", ".jpg", ".jpeg", ".hdr", ".exr", ".mp4", ".webm", ".ktx2", ".basis"];

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else files.push({ p, size: s.size, ext: extname(name).toLowerCase() });
  }
})(OUT);

const fails = [];
const warns = [];

// 1) .nojekyll
if (!existsSync(join(OUT, ".nojekyll")))
  fails.push(".nojekyll missing in out/ — GitHub Pages will 404 every _next/ path (blank site).");

// 2) totals
const total = files.reduce((a, f) => a + f.size, 0);
const js = files.filter((f) => f.ext === ".js").reduce((a, f) => a + f.size, 0);
const assets = files.filter((f) => HEAVY.includes(f.ext)).reduce((a, f) => a + f.size, 0);

// 3) heavy individual assets
for (const f of files) {
  if ((f.ext === ".glb" || f.ext === ".gltf") && f.size > GLB_WARN)
    warns.push(`${f.p} is ${mb(f.size)} — compress: gltf-transform optimize ... --compress meshopt --texture-compress ktx2`);
  if ((f.ext === ".png" || f.ext === ".jpg" || f.ext === ".jpeg") && f.size > IMG_WARN)
    warns.push(`${f.p} is ${mb(f.size)} — likely uncompressed; convert to KTX2/webp or downscale.`);
}

// 4) subpath 404 risk — bare absolute asset URLs in HTML not going through basePath
const htmls = files.filter((f) => f.ext === ".html");
let bareUrls = 0;
for (const f of htmls) {
  const html = readFileSync(f.p, "utf8");
  // crude but effective: src/href="/models|textures|env|sprites|audio|video/..." with no repo prefix
  const m = html.match(/(?:src|href)="\/(?:models|textures|env|sprites|audio|video|fonts)\//g);
  if (m) bareUrls += m.length;
}
if (bareUrls > 0)
  warns.push(`${bareUrls} absolute asset URL(s) in HTML not prefixed — verify they route through withBase() or they 404 under /REPO.`);

// report
const top = [...files].sort((a, b) => b.size - a.size).slice(0, 10);
console.log(`\n${DIM}── build audit: ${OUT} ──${RST}`);
console.log(`total ${mb(total)}   js ${mb(js)}   heavy-assets ${mb(assets)}   files ${files.length}`);
console.log(`${DIM}largest:${RST}`);
for (const f of top) console.log(`  ${kb(f.size).padStart(8)}  ${f.p}`);

if (total > PAYLOAD_BUDGET_MB * 1024 * 1024)
  warns.push(`total output ${mb(total)} exceeds ${PAYLOAD_BUDGET_MB}MB budget (code-split + lazy-load + compress; not all of this is initial, but check what's behind the preloader).`);

console.log("");
for (const w of warns) console.log(`${YEL}⚠ ${w}${RST}`);
for (const f of fails) console.log(`${RED}✗ ${f}${RST}`);

if (fails.length) { console.log(`\n${RED}FAIL — ${fails.length} blocking issue(s).${RST}\n`); process.exit(1); }
console.log(`\n${GRN}✓ no blocking issues${warns.length ? ` (${warns.length} warning${warns.length > 1 ? "s" : ""})` : ""}.${RST}\n`);
