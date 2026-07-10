// Deterministic scroll test: real trusted wheel events → does Lenis animate? (headless, light tier)
import { chromium } from "playwright";
const b = await chromium.launch({ headless: true, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1360, height: 850 } });
p.on("pageerror", (e) => console.log("PAGEERR:", e.message));
await p.goto("http://localhost:3000/?tier=safe&posters=1", { waitUntil: "load", timeout: 45000 });
await p.waitForFunction(() => !!window.__lenis, { timeout: 20000 });
await p.waitForTimeout(3500);

const before = await p.evaluate(() => ({ p: window.__lenis.progress, hidden: document.hidden }));
await p.mouse.move(680, 425);
const samples = [];
for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, 200); await p.waitForTimeout(130); samples.push(await p.evaluate(() => +window.__lenis.progress.toFixed(3))); }
await p.waitForTimeout(700);
const after = await p.evaluate(() => ({ progress: +window.__lenis.progress.toFixed(3), animated: Math.round(window.__lenis.animatedScroll), target: Math.round(window.__lenis.targetScroll) }));

console.log(JSON.stringify({ scrollWorks: after.progress > before.p + 0.02, before, samples, after }, null, 1));
await b.close();
