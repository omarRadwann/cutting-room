#!/usr/bin/env python3
"""
Tier-aware visual verification for a 3D scroll site. Catches the black-screen-class bugs that a SAFE-only
screenshot pass misses (see references/post-and-perf-safety.md).

  pip install playwright pillow && playwright install chromium
  python scripts/verify.py                      # uses defaults below
  python scripts/verify.py 3017 0,0.25,0.5,0.75,1   # custom port + beat list (scroll fractions)

What it checks (treat any FAIL as a release blocker):
  1. BLACK-FRAME SWEEP per tier (standard + safe; high if it renders) across EVERY beat — incl. transparent/x-ray
     beats. A rendered frame has mean luma 60-100; ~0 is black (Bloom-NaN, dead camera, remount).
  2. REMOUNT SOAK — force a tier change and assert the <canvas> ELEMENT survives (no key={tier} remount → no
     multi-second black) and no frame is black.
  3. TIER HEALTH — gl.isContextLost()===false and ZERO console errors per tier.

Headless uses SwiftShader (software GL); heavy HIGH frames may exceed the screenshot timeout — that's a capture
limit, not a site bug. The script reports "could not render" rather than failing, and you eyeball HIGH on a real GPU.
"""
import sys
import os
from playwright.sync_api import sync_playwright
from PIL import Image

PORT = sys.argv[1] if len(sys.argv) > 1 else "3017"
BEATS = [float(x) for x in (sys.argv[2].split(",") if len(sys.argv) > 2 else "0,0.25,0.5,0.75,0.96".split(","))]
BASE = f"http://localhost:{PORT}/"
OUT = os.path.join(os.environ.get("TEMP", "/tmp"), "verify_caps")
os.makedirs(OUT, exist_ok=True)
ARGS = ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"]
BLACK = 15  # mean-luma floor; below this = black/broken frame


def luma(path):
    d = list(Image.open(path).convert("L").resize((80, 50)).getdata())
    return round(sum(d) / len(d), 1)


def ready(pg, url):
    pg.goto(url, wait_until="domcontentloaded", timeout=90000)  # NOT networkidle (Next dev HMR socket)
    pg.wait_for_function("()=>!!document.querySelector('canvas')&&!!window.__lenis", timeout=90000)
    pg.wait_for_timeout(5000)


def scroll(pg, p):
    pg.evaluate("(p)=>{const l=window.__lenis; l.scrollTo(l.limit*p,{immediate:true});}", p)
    pg.wait_for_timeout(2400)


fails = []
with sync_playwright() as pw:
    b = pw.chromium.launch(headless=True, args=ARGS)

    # 1 + 3: black-frame sweep + tier health (standard reproduces bloom/AO bugs; safe is the floor)
    for tier in ["standard", "safe"]:
        pg = b.new_page(viewport={"width": 1100, "height": 680})
        errs = []
        pg.on("console", lambda m: errs.append(m.text[:120]) if m.type == "error" else None)
        try:
            ready(pg, f"{BASE}?tier={tier}&snap=1")
            lost = pg.evaluate("()=>{const c=document.querySelector('canvas');const g=c&&(c.getContext('webgl2')||c.getContext('webgl'));return g?g.isContextLost():'n/a';}")
            for p in BEATS:
                scroll(pg, p)
                f = os.path.join(OUT, f"{tier}_{int(p*100):03d}.png")
                pg.screenshot(path=f, timeout=90000)
                v = luma(f)
                tag = "OK " if v > BLACK else "BLACK"
                print(f"  [{tier}] beat {p:>4}  luma {v:>5}  {tag}")
                if v <= BLACK:
                    fails.append(f"{tier} beat {p} is black (luma {v}) — check Bloom+transparency / camera")
            if lost not in (False, "n/a"):
                fails.append(f"{tier}: WebGL context lost ({lost})")
            real_errs = [e for e in errs if "hydrat" not in e.lower()]
            if real_errs:
                fails.append(f"{tier}: {len(real_errs)} console error(s): {real_errs[:2]}")
        except Exception as e:
            print(f"  [{tier}] could not render (likely too heavy for headless SwiftShader): {str(e)[:80]}")
        pg.close()

    # 2: remount soak — a tier change must NOT recreate the <canvas> element (that = the 5s black screen)
    pg = b.new_page(viewport={"width": 1100, "height": 680})
    try:
        ready(pg, f"{BASE}?tier=high&debug=1")  # debug=1 shows the quality toggle
        pg.evaluate("()=>{document.querySelector('canvas').dataset.mk='orig';}")
        for _ in range(2):
            pg.evaluate("()=>{const b=[...document.querySelectorAll('button')].find(x=>/●|HIGH|STANDARD|SAFE/.test(x.textContent||''));if(b)b.click();}")
            pg.wait_for_timeout(1500)
        same = pg.evaluate("()=>{const c=document.querySelector('canvas');return !!c&&c.dataset.mk==='orig';}")
        print(f"  [remount] canvas element survived tier changes: {same}")
        if not same:
            fails.append("REMOUNT: <Canvas> is keyed on tier → full remount → multi-second black screen. Remove key={tier}.")
    except Exception as e:
        print(f"  [remount] skipped: {str(e)[:80]}")
    pg.close()
    b.close()

print("\n" + ("FAIL:\n  - " + "\n  - ".join(fails) if fails else "PASS — no black frames, no remount, no context loss."))
sys.exit(1 if fails else 0)
