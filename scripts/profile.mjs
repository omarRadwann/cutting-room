#!/usr/bin/env node
/**
 * Scroll frame-time DISTRIBUTION profiler — the median-FPS-lies gate (production-hardening.md §A).
 * Records requestAnimationFrame deltas during a scripted top→bottom→top scroll and reports
 * p50/p95/p99/max + counts of frames >16.7ms and >33ms, with the SCROLL POSITION of each severe spike
 * (spikes clustered at even progress = section/transition work → your fix targets).
 *
 * One-time setup (kept out of the scaffold deps to stay lean):
 *   npm i -D playwright && npx playwright install chromium
 *
 * Usage (start the dev or a static server first):
 *   npm run dev                       # or: npx serve out
 *   node scripts/profile.mjs                      # defaults to http://localhost:3000
 *   node scripts/profile.mjs http://localhost:3000 9   # url + scroll seconds
 *
 * PASS = p99 under ~16ms and zero recurring per-transition spikes. Exits 1 on FAIL.
 */
const URL = process.argv[2] || "http://localhost:3000";
const SECS = Number(process.argv[3] || 9);

let chromium;
try { ({ chromium } = await import("playwright")); }
catch {
  console.error("Playwright not installed. Run:  npm i -D playwright && npx playwright install chromium");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(2500); // let the preloader finish + first compile settle

// record rAF deltas while scrolling top→bottom→top
const rows = await page.evaluate(async (secs) => {
  const out = [];
  let last = performance.now(), stop = false;
  const lenis = window.__lenis; // SmoothScroll exposes this; falls back to window scroll
  (function loop() { const n = performance.now(); out.push({ d: n - last, p: lenis ? lenis.progress : (scrollY / (document.body.scrollHeight - innerHeight) || 0) }); last = n; if (!stop) requestAnimationFrame(loop); })();
  const half = (secs * 1000) / 2;
  const limit = lenis ? lenis.limit : document.body.scrollHeight - innerHeight;
  if (lenis) lenis.scrollTo(limit, { duration: secs / 2 }); else { const steps = 60; for (let i = 1; i <= steps; i++) { scrollTo(0, (limit * i) / steps); await new Promise(r => setTimeout(r, half / steps)); } }
  await new Promise((r) => setTimeout(r, half + 200));
  if (lenis) lenis.scrollTo(0, { duration: secs / 2 }); else scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, half + 200));
  stop = true;
  return out;
}, SECS);

await browser.close();

const d = rows.map((r) => r.d).filter((x) => x > 0).sort((a, b) => a - b);
if (!d.length) { console.error("No frames recorded — is the URL live and animating?"); process.exit(1); }
const q = (f) => d[Math.min(d.length - 1, Math.floor(d.length * f))];
const over = (t) => rows.filter((r) => r.d > t);
const severe = over(33);

const RED = "\x1b[31m", GRN = "\x1b[32m", YEL = "\x1b[33m", DIM = "\x1b[2m", RST = "\x1b[0m";
console.log(`\n${DIM}── scroll frame-time distribution (${URL}, ${SECS}s round trip, ${rows.length} frames) ──${RST}`);
console.log(`p50 ${q(0.5).toFixed(1)}ms   p95 ${q(0.95).toFixed(1)}ms   p99 ${q(0.99).toFixed(1)}ms   max ${d[d.length - 1].toFixed(1)}ms`);
console.log(`frames >16.7ms: ${over(16.7).length}   >33ms (severe): ${severe.length}`);
if (severe.length) {
  console.log(`${YEL}severe spikes at scroll progress:${RST} ${[...new Set(severe.map((r) => (r.p * 100).toFixed(0) + "%"))].join(", ")}`);
  console.log(`${DIM}  (clustered/even progress = section/transition work — see production-hardening.md §A: idempotent texture setup, no needsUpdate on swap, no backdrop-filter remount, pre-warm)${RST}`);
}
if (errors.length) console.log(`${YEL}console errors:${RST} ${errors.slice(0, 5).join(" | ")}`);

const pass = q(0.99) < 16 && severe.length === 0;
console.log(pass ? `\n${GRN}✓ PASS — smooth scroll, no severe spikes.${RST}\n` : `\n${RED}✗ FAIL — p99 ${q(0.99).toFixed(1)}ms / ${severe.length} severe spike(s). Hunt them per production-hardening.md §A.${RST}\n`);
process.exit(pass ? 0 : 1);
