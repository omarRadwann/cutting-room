# Starter scaffold (Next.js + R3F) — hardened from frame one

The **awwwards-architect** starter. It pre-wires not just the crown-jewel patterns but the
**production-hardening layer that otherwise takes a 20-message grind to rediscover**. The first build
inherits all of it — don't strip it to "add later."

## What's wired (the spine)
- `components/SmoothScroll.tsx` — the **single render clock** (Lenis ← `gsap.ticker`, ScrollTrigger synced,
  reduced-motion aware). Writes `lib/scroll-store.ts` (module singleton — 3D reads scroll without context).
- `components/Scene.tsx` — color-managed `<Canvas>`, **adaptive 3-tier quality**, tier-gated post-FX
  (conditional children, updated **IN PLACE** — never `key={tier}` on the Canvas; that remounts the context →
  a ~5s black screen, `references/footguns.md` #1), pre-warm. (see hardening below)
- `components/ScrollCameraRig.tsx` — camera driven by scroll progress (swap for a baked track).
- `components/SignatureMesh.tsx` + `shaders/signature.ts` — placeholder signature effect; **replace with
  the concept's real hero** (the screenshot-able "wow" beat).
- `components/Preloader.tsx` (real-progress) · `components/CustomCursor.tsx` (reduced-motion/touch aware).
- `app/globals.css` — tokens, reduced-motion safety net, skip-link, cursor styles, + the **DOM craft layer**.

## What's wired (the DOM craft layer — the site over the canvas)
The 2D layer of non-negotiable #4, harvested/generalized from shipped award builds. Guide:
`references/dom-craft-layer.md`.
- **`components/Kinetic.tsx`** — accessible, SSR-safe masked split-text headline reveal (the crisp type beat).
- **`components/Announcer.tsx` + `lib/announce.ts`** — the one ARIA live region; `announce("…")` from anywhere
  (the aria-hidden canvas can't speak to a screen reader on scroll "routes").
- **`components/ExperienceBoundary.tsx`** — wraps the Canvas so a WebGL failure degrades to crawlable content
  instead of a blank page (the a11y/SEO floor).
- **SEO**: `app/robots.ts` + `app/sitemap.ts` (static, basePath-aware) + rich OG/Twitter `metadata` in
  `app/layout.tsx`. Set `NEXT_PUBLIC_SITE_URL` at deploy; compose a real `/og.jpg`.
- **CSS**: `:focus-visible` ring, `.eyebrow`/`.mono` type voices, `.nav-link`, `[data-magnetic]`, `.reveal`,
  `.kin-*`, and the `.h-track` horizontal-gallery shell.

## What's wired (the hardening — the part that saves the grind)
- **`lib/quality.ts`** — HIGH / STANDARD / SAFE. HIGH **pinned to its DPR cap** (crisp); STANDARD/SAFE
  adaptive; **DPR floor 1.0 on all** (never sub-native → blur). GPU/feature detection, `?tier=` override,
  `cycleTier()`, and a hook for the boot FPS sampler.
- **`lib/perf-store.ts` + `components/PerfReporter.tsx` + `components/DebugOverlay.tsx`** — the
  instrumentation rig. Open with **`?debug=1`** (or Shift+D): tier / true DPR / fps 1s+10s / draws / tris /
  GPU. PerfReporter fixes `gl.info` under a composer (autoReset) and reads the **true backbuffer DPR**.
  This is your only honest source for the numbers you tune against. It's mounted in `app/page.tsx`.
- **`components/QualityToggle.tsx`** — dev cycle HIGH→STANDARD→SAFE (hide/gate before ship).
- **`lib/textures.ts`** — `prepColorTexture()` (idempotent — won't re-upload on swap) and `swapMap()`
  (recompile-free map swap). These two kill the per-transition scroll-stutter spikes.
- **`lib/withBase.ts`** — wrap **every** asset URL (GLB, `useGLTF.preload`, textures, HDRI) so a project
  subpath doesn't 404.
- **`public/.nojekyll`** + **`scripts/deploy.mjs`** (`npm run deploy`) — safe GitHub Pages deploy that
  can't fall into the env-mangling / missing-`.nojekyll` / build-over-dev traps.
- **`next.config.mjs`** — static export, `basePath` from `NEXT_PUBLIC_BASE_PATH`.

## Optional primitives (shipped in `lib/`, wire when the build needs them)
Ready-to-use but NOT auto-wired (they need story/asset-specific decisions) — adopt deliberately:
- **`lib/deviceTier.ts`** — GPU-string tier detection (Apple-mask + integrated split), `clampDpr()` iGPU
  fill-rate pin, `initialTier()` (GPU seed = ceiling, boot-FPS demote-only), `readForcedTier()`. **Cooperates
  with `lib/quality.ts`** (the live-tier store): in `Scene.tsx` `onCreated`, read the real GPU + apply the iGPU
  DPR pin — don't double-apply `?tier=`. Guide: `references/device-tiering.md`.
- **`lib/beats.ts`** — canonical↔physical scroll remap + named-beat windowing. In `SmoothScroll.tsx` write
  `scroll.progress = toCanonical(e.progress)`, `calibrate()` after fonts/layout + on resize, and replace the
  placeholder `BEATS` with the story's real moments. Guide: `references/scroll-architecture.md`.
- **`lib/audioEngine.ts`** — music-on-scroll (a muted-autoplay `<audio>` bed unmuted on the first wheel/click —
  the only way to get sound on scroll pre-gesture) + cue ducking + velocity wind + `getLevel()` analyser for
  audio-reactive emissives. Drop a track at `public/audio/ambient.mp3`; `initBed()` on mount, `unlock()` on
  first gesture, `setBedActive()` per section. Guide: `references/recipes.md` §14.

## Use
```bash
npm install
npm run dev        # develop (localhost:3000) — open ?debug=1 to see the perf overlay
npm run typecheck  # tsc --noEmit — safe mid-iteration (does NOT touch ./.next like a build does)
npm run build      # static site → ./out
REPO=my-repo npm run deploy   # build (basePath /my-repo) + publish ./out → gh-pages, with .nojekyll
```
> ⚠ Never run `npm run build`/`deploy` while `npm run dev` is running — they share `./.next` and the build
> clobbers the dev tab (raw HTML / stuck preloader). Stop dev first.

## Adapt
1. Fonts in `app/layout.tsx`, palette/tokens in `globals.css` → the art-direction board.
2. Build each storyboard scene as a full-height `<section>` in `app/page.tsx`.
3. Replace `SignatureMesh` with the hero; load assets in `Scene.tsx` via `withBase()` + `prepColorTexture()`;
   add `gl.initTexture(tex)` for hero textures in `PreWarm`. Use `swapMap()` for any per-scene map change.
4. Tune post-FX in `Scene.tsx` (already tier-gated). For a **hero product**: keep DOF `bokehScale` ~0 at
   rest, bloom threshold ~0.9, and desaturate the fill light toward white. (references/production-hardening.md §C)

## Definition of Done — the FIRST deliverable must already pass ALL of these
Do not present a build as done until every box is true. This list is *why* the grind happened; honoring it
up front is how you skip it. Verify with `?debug=1` on the **user's actual tier/device**, not just yours.

- [ ] **Concept + signature interaction** are stated and present (not a pile of effects).
- [ ] Renders (not blank), **0 console/network errors**, on HIGH *and* SAFE.
- [ ] **Hero/product reads crisp & true** — no DOF blur at rest, no bloom halo on white, no saturated-fill
      wash, anisotropy on. ("Looks low quality" is almost never resolution — it's these.)
- [ ] **Scroll profiled as a distribution** (not avg FPS): p99 under ~12ms and **no recurring per-transition
      spikes** (texture re-upload / shader recompile / DOM remount all eliminated).
- [ ] **DPR floored at 1.0**; HIGH at cap; STANDARD/SAFE adaptive — confirmed in the overlay.
- [ ] **reduced-motion** truly stops the loop; **mobile (390px)** holds; visible **focus rings**.
- [ ] **a11y skeleton:** canvas `aria-hidden` + real content in `<main>`; skip link; focus moves to the active
      section on scroll "routes"; `announce()` live region fires; `ExperienceBoundary` degrades cleanly.
- [ ] **SEO/share:** title + description + **composed OG image** in voice; `robots.ts`/`sitemap.ts` carry the
      real `NEXT_PUBLIC_SITE_URL`; body copy is crawlable DOM, not baked into the canvas.
- [ ] Every asset routed through **`withBase()`**; deploy verified **served under `/REPO` with 0 asset 404s**;
      `out/.nojekyll` present.
- [ ] The **5 non-negotiables** present + production polish (preloader, cursor, transitions, one easter egg).
- [ ] Rubric in `references/perf-a11y-checklist.md` scores **≥ 9.0**.

See the skill's `references/` for recipes, motion language, asset generation, the rubric, and
`production-hardening.md` (the gotchas these defaults encode).
