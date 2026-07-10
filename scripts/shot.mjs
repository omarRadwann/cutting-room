// Faithful frame capture for the taste loop. Headless SwiftShader can't decode H.264, so we shoot in
// ?posters mode (all panels show their poster) at a fixed viewport, scrubbing beats via window.__setForce.
// Usage: node scripts/shot.mjs            (default beats)
//        node scripts/shot.mjs 0.42       (single custom progress)
import { chromium } from "playwright";
import fs from "node:fs";

const OUT = "C:/Users/acer/AppData/Local/Temp/claude/C--Users-acer-Desktop-m3lm/cd2cd902-5738-4185-a601-cdef6b7529d8/scratchpad/shots";
fs.mkdirSync(OUT, { recursive: true });
// safe tier => no heavy post (SwiftShader can't raster bloom/AO at speed); DPR floored at 1 => fast + faithful
// for COMPOSITION/layout/colour/type. Judge bloom/materials/reflections on the real GPU separately.
const TIER = process.env.TIER || "safe";
const DPR = process.env.DPRCAP || "";
const BASE = `http://localhost:3000/?posters=1&tier=${TIER}${DPR ? `&dpr=${DPR}` : ""}`;
const VW = +(process.env.VW || 1360), VH = +(process.env.VH || 850);

const custom = process.argv[2] != null ? parseFloat(process.argv[2]) : null;
const beats = custom != null
  ? [{ name: `p${custom}`, p: custom }]
  : [
      { name: "1-intro", p: 0.0 },
      { name: "2-reveal", p: 0.05 },
      { name: "3-browse-a", p: 0.16 },
      { name: "4-browse-mid", p: 0.44 },
      { name: "5-browse-late", p: 0.72 },
      { name: "6-colophon", p: 0.99 },
    ];

const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist", "--enable-webgl", "--use-cmd-decoder=passthrough"],
});
const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.log("PAGEERR:", e.message));

await page.goto(BASE, { waitUntil: "load", timeout: 45000 });
// wait for WebGL canvas + posters to warm
await page.waitForFunction(() => { const c = document.querySelector("canvas"); return c && c.width > 200; }, { timeout: 25000 }).catch(() => console.log("canvas wait timeout"));
await page.waitForTimeout(9000);

for (const b of beats) {
  // real scroll (Lenis moves BOTH the DOM overlays and the 3D) => faithful frame
  await page.evaluate((v) => { const L = window.__lenis; if (L) L.scrollTo(Math.round(v * L.limit), { immediate: true }); }, b.p);
  await page.waitForTimeout(1700); // camera damp + drum settle
  await page.screenshot({ path: `${OUT}/${b.name}.png`, timeout: 60000, animations: "disabled" });
  console.log("shot", b.name, "p=", b.p);
}

// focus / case-study beat (scroll into the drum first, then focus a clip)
await page.evaluate(() => { const L = window.__lenis; if (L) L.scrollTo(Math.round(0.44 * L.limit), { immediate: true }); });
await page.waitForTimeout(600);
await page.evaluate(() => window.__setFocus && window.__setFocus(3));
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}/7-focus.png`, timeout: 60000, animations: "disabled" });
console.log("shot 7-focus");

await browser.close();
console.log("done ->", OUT);
