// Compose the OG / share card (1200x630) → public/og.jpg. Needs the dev server running (for the image).
import { chromium } from "playwright";

const html = `<!doctype html><html><head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,400&family=Amiri&family=Inter:wght@500&display=swap" rel="stylesheet">
<style>
  *{margin:0;box-sizing:border-box}
  body{width:1200px;height:630px;overflow:hidden;background:#07070b}
  .wrap{position:relative;width:1200px;height:630px}
  .bg{position:absolute;inset:0;background:url('http://localhost:3000/media/hero.webp') center 42%/cover}
  .scrim{position:absolute;inset:0;background:
    linear-gradient(101deg, rgba(7,7,11,0.97) 0%, rgba(7,7,11,0.84) 36%, rgba(7,7,11,0.25) 66%, rgba(7,7,11,0.55) 100%),
    linear-gradient(0deg, rgba(7,7,11,0.6) 0%, transparent 30%)}
  .content{position:absolute;left:74px;top:0;height:630px;display:flex;flex-direction:column;justify-content:center;gap:12px;width:660px}
  .eyebrow{color:#d8a24a;letter-spacing:0.34em;text-transform:uppercase;font-family:'Inter',sans-serif;font-size:15px;font-weight:500}
  .title{color:#f2ede3;font-family:'Fraunces',serif;font-size:104px;line-height:0.9;letter-spacing:-0.03em;font-weight:600}
  .ar{font-family:'Amiri',serif;color:#d8a24a;font-size:44px;margin-top:8px}
  .tag{color:#9a9488;font-family:'Inter',sans-serif;font-size:23px;line-height:1.5;max-width:30ch;margin-top:14px}
  .rule{width:64px;height:2px;background:#d8a24a;margin-top:20px;opacity:.8}
</style></head><body>
<div class="wrap">
  <div class="bg"></div><div class="scrim"></div>
  <div class="content">
    <div class="eyebrow">A cinematic film &amp; motion studio</div>
    <div class="title">The Cutting<br>Room</div>
    <div class="ar">غرفة المونتاج</div>
    <div class="rule"></div>
    <div class="tag">Architecture, fashion &amp; product — directed, lit and graded in-house. Cairo, working worldwide.</div>
  </div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(1800);
await page.screenshot({ path: "public/og.jpg", type: "jpeg", quality: 90 });
await browser.close();
console.log("wrote public/og.jpg");
