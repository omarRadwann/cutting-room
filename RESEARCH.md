# A 3D / WebGL Portfolio for Your AI Cinematic-Advertising Craft
### Deep research & concept document — 2026-07-08

> Goal: a jaw-dropping, award-level 3D website that showcases your video-creation and animation
> skill so convincingly that a first-time visitor says "wow" and wants to hire you — while the
> site *itself* proves you're a serious engineer. This document is research and strategy only.
> Nothing here is built yet.

---

## 0. Executive summary — the one bet

You have **525 finished, high-craft assets** (93 videos + 432 stills), and **~90%+ are 9:16
vertical**. That single fact should drive the entire design. Most award-winning 3D sites assume
landscape; the winning move for you is the opposite — **make verticality the identity**: screens as
monoliths, columns, vitrines, obelisks, a colonnade you walk between.

**Recommended direction — "The Cutting Room":** a dark editorial atelier in which your best clips
live on a **rotating cylindrical drum of 9:16 panels** you spin with inertia (drag / scroll). Click a
panel and the camera **dollies in** while the panel unfolds to full-bleed film with sound (the
Obys "bloom" move). Work is chaptered **by material/vibe** (Light, Motion, Macro, Cairo), the
background **recolors to each ad's grade** as you move, and a shared motion "nervous system" makes
drag, dolly, and cut feel like one hand. Your Egyptian register (Luxor colonnade, obelisk of
light) is the cultural signature no reference site occupies.

This is the **lowest-risk, highest craft-to-effort** path because you already own ~80% of the
engine (see §3). The two hard, genuinely new problems are (a) playing **many** short videos in
WebGL without melting mobile, and (b) a true **9:16 vertical player**. Both are solved problems —
§6–§8 lay out exactly how.

**Two precedents to study frame-by-frame before building:**
- **Spotify Wrapped** (Active Theory) — proves vertical, cinematic *sequencing* in WebGL.
- **Cartier Watches & Wonders** (Immersive Garden) — proves chaptered 3D "rooms" + Web Audio as a
  narrative layer, on a luxury brief.

---

## 1. Asset intelligence — what you actually have

Pulled and censused live from your Higgsfield workspace (private, `max` plan, ~700 credits).

**Totals: 525 unique finished generations — 93 videos, 432 images.** Date range ≈ 18 days of
intense output (late-June → 8 Jul 2026). Everything is `completed` with a usable URL.

**Format (the decisive constraint):**
- Video: **65 of 93 are 9:16**, 9 are 16:9, rest unlabeled (upscales/edits). Durations 4–15s
  (mode = 5s). Resolution 480p (43), 720p (20), 1080p (9). Silent or music-bed — loopable.
- Image: **345 of 432 are 9:16**; only 79 are non-vertical (1:1, 4:5, 16:9, 4:3). These 2–9 MB
  PNGs are genuinely high-resolution.

**Models used:** Seedance 2.0 (video hero, 64), Topaz (14 upscale masters), Kling 3.0 / Kling edit
(6), Seedance mini (7); stills almost all Nano Banana Pro (322) + Nano Banana / Flash.

**Campaign map (mutually-exclusive estimate):**

| Collection | Videos | Images | Total | Register |
|---|---:|---:|---:|---|
| ZEE footwear (sandals/clogs/slides) | 26 | 112 | **138** | Product motion, exploded-layer, desert/bazaar |
| Invisible-wearer fashion | 29 | 83 | **112** | Surreal editorial — empty outfits walking |
| Jewelry (oval-diamond ring) | 7 | 42 | **49** | Hyperreal macro, jeweller's bench |
| STOLCH / Luxor glass-cube fashion | 4 | 41 | **45** | Cinematic narrative, cultural |
| Beauty / cosmetics | 1 | 28 | **29** | Product |
| Handbags | 1 | 18 | **19** | Product |
| Perfume | 0 | 16 | **16** | Product light-play |
| Chocolate (Sladoska) | 0 | 13 | **13** | Product / bouquet |
| Unclassified (incl. real-estate/aerial) | 25 | 79 | **104** | Mixed — see below |

**Hero tier already identifiable:** ~**10 fifteen-second cinematic films** (incl. "THE CRYSTAL
CITY — A WORLD OF HER OWN", montage brand films), **23 HQ masters** (1080p or Topaz-upscaled), and a
surprise seam of **1080p architectural real-estate time-lapses + aerial drone films** — meaning your
reel isn't only product ads; it can also claim *scale/environment* work. Curate the site to the
best ~24–40 clips, not all 93.

**I viewed a spread directly to judge craft (not just prompts):**
- *Jewelry macro* — a diamond lowered by tweezers into a rose-gold setting, blue rim-light streak,
  true shallow-DOF bokeh. Reads as real product cinematography.
- *STOLCH / Luxor* — two models inside a glowing glass cube in the illuminated Luxor colonnade at
  blue hour, a live crowd filming on phones. Legible logo text (you solved the AI text-garble
  problem). Genuine narrative. **Note the glowing cube is itself a 3D motif the site can adopt.**
- *Invisible-wearer* — five empty outfits (hair + sunglasses floating) walking a backlit dune with
  long shadows. Surreal, high-concept, editorial.

**Verdict:** the work is consistent and strong across three registers — hyperreal product,
cinematic narrative, surreal editorial. That range is itself a selling point and suggests
chaptering by *register/material* rather than by client.

---

## 2. The strategic insight — a vertical-first 3D site

The entire brief hinges on one under-appreciated fact: **your medium is portrait.** Award 3D
galleries (curved carousels, image planes, tunnels) were designed around 16:9. Naively dropping 9:16
clips into them yields "a wall of phones" — generic and slightly sad.

The reframe: **let the 9:16 aspect become the architecture.** Portrait rectangles are *columns,
banners, steles, monoliths, vitrines, obelisks, cartouches.* This is not a workaround — it is the
differentiator. It also happens to rhyme with your actual Cairo/Luxor content (a temple colonnade
*is* a row of vertical forms), giving the site a cultural through-line that no competitor portfolio
has. Verticality + Egyptian light is your open lane.

Design consequences that follow from portrait-first:
- **Camera lives close and low**, moving laterally or orbitally (like walking a colonnade), not the
  usual dolly-through-landscape.
- **Curvature is your friend** — arranging portrait panels on a cylinder/arc makes them feel
  intentional instead of cramped.
- **Negative space above/below** each clip is real estate for kinetic type (bilingual Latin +
  Arabic) and the color-grade wash.

---

## 3. What you're standing on (reusable IP)

You are *not* starting from zero. A survey of your shipped R3F sites shows ~80% of the engine already
exists and is battle-tested.

**Current stack (mid-2026):** Next **16.2**, React **19**, `@react-three/fiber` **9**, `drei` **10**,
`@react-three/postprocessing` **3**, `three` **0.184**, `gsap` **3.15**, `lenis` **1.3**, `zustand`
5, Tailwind 4, TS 5, Playwright. Ships as **static export → GitHub Pages** (`output:'export'`,
`images.unoptimized`, `basePath` via env, `.nojekyll`, everything routed through `lib/withBase.ts`).

**The crown jewel — you've already shipped video-in-WebGL.** `E:\master_3D\okhtein` maps a seamless
video loop onto a mesh via drei `useVideoTexture`, **scroll-gated** (play only when in view), isolated
in its **own `<Suspense>`** so a stalled clip can't black the whole scene. That is exactly the
primitive a video portfolio is built from.

**Directly reusable scaffold (from okhtein / perfumes / ras-el-hekma / Electrico / hadia-ghaleb):**
- Adaptive quality: `lib/deviceTier.ts` (SAFE / STANDARD / HIGH), `PerformanceMonitor` one-step
  walk, GPU-string detection, `prefers-reduced-motion` static fallback.
- One-clock `SmoothScroll` (Lenis) + baked scroll-camera rig (CatmullRom path, frame-rate-independent
  damping, named "hold" beats).
- Production furniture: `Preloader`, `CustomCursor`, kinetic-type component, `ExperienceBoundary`,
  `?debug=1` rig, `withBase()` asset routing.
- Shaders you already own: transmission glass (per-tier samples + safe fallback), Gerstner
  water/caustics, sky/day-cycle, GPGPU beam, mesh↔particle dissolve, bloom/AO post.
- Ops: committed `deploy.mjs` / `audit.mjs` / `profile.mjs` / `shot.mjs`, and a **Playwright +
  SwiftShader** headless verify harness.
- **Director:** your `awwwards-architect` skill (Phase 0 Discovery → 1 Concept ▣ → 2 Art-Direction ▣
  → 3 Scaffold → 4 Build → 5 Polish → 6 Verify/Ship; 11-axis composition rubric; anti-slop rules).

**Hard-won gotchas already documented (don't re-learn these the hard way):**
- R3F v9 **clones** `<shaderMaterial uniforms={}>` — mutating your copy never reaches the GPU; hold a
  material ref and write `mat.current.uniforms.*.value` in `useFrame`.
- Headless verify: an **unfocused tab reports `document.hidden` → rAF pauses**, so frame counters
  hang; real FPS needs a foreground browser. A **SAFE-tier screenshot is a trap** (it disables the
  very effects that break). **H.264 often won't decode in headless** SwiftShader — verify video
  headed on the real GPU.
- Intel Iris Xe: floor DPR at 1.0; gate shadows/bloom/AO off on integrated; a tier flip-flop
  **remounts video textures → "garbled screens"** (pin tier once resolved).

**Greenfield (must build new):** the ONE signature interaction (mandatory, unique per project); a
real **many-videos** streaming/lazy pipeline (existing sites use a single ~1.5 MB loop, not dozens);
and a true **9:16 vertical player** UX (autoplay-on-focus, aspect framing, sound toggle). §6–§8 cover
these.

---

## 4. The field — references & interaction patterns

### 4.1 Reference set (study these)

| Site | Why it matters here |
|---|---|
| **Spotify Wrapped** — Active Theory (`spotify.activetheory.net`) | The proof that **vertical, cinematic sequencing** works in WebGL; MSDF text on Z-layered planes for parallax |
| **Cartier Watches & Wonders** — Immersive Garden | Six self-contained 3D "rooms" scrolled like a museum after hours; **Web Audio score as narrative** (Three.js + Blender + GSAP + Lenis) |
| **Obys Agency** (`obys.agency`) | Strict grid tiles that **bloom into full-bleed WebGL video on hover** + morphing kinetic type — your detail-view mechanic |
| **Active Theory** (`activetheory.net`) | Portfolio gold standard: thumbnails **animate into** full-screen experiences |
| **Lando Norris** — OFF+BRAND (Awwwards SOTY 2025) | 3D object tracks scroll progress; kinetic type as cinematic scaffolding |
| **Igloo Inc** (SOTY 2024) | Scroll *is* the journey — every interaction dissolves into one fluid transition |
| **Lusion** (`lusion.co`, SOTY 2023) | Ambitious real-time craft; "Gemini" shows one product through two rendering lenses |
| **Bruno Simon** (`bruno-simon.com`) | Proof-of-engineering *as* the portfolio (playable 3D world) |
| **Immersive Garden — LV VIA / Merci-Michel / Tendril / ManvsMachine / Buck** | Luxury restraint, object-as-portal, high-craft product-film reel presentation |
| **Robin Noguier / Aristide Benoist / Unseen / Utsubo** | Solo-to-studio portfolios blending dev + design + 3D with tactile transitions |
| **SHIFTBRAIN — Lions Good News** (via Codrops) | Origin of the draggable **infinite cylindrical gallery** everyone now copies |
| **BarkleyUS webgl-video-wall** (GitHub) | Viewer inside a sphere of video faces — a hero-moment reference |

### 4.2 Interaction-pattern menu — with a verdict for *vertical video*

- **Cylindrical / curved carousel (drum of panels)** — *BEST FIT.* 9:16 panels sit naturally as
  staves on a rotating drum; curvature makes portrait feel deliberate. (Codrops "Infinite Circular
  Gallery", OGL/GLSL, arc via `cos`, infinite wrap via an `extra` offset, paper-bend vertex
  distortion.)
- **Portal / tunnel / colonnade of screens** — *high wow, moderate cost.* Perfect for a "descend a
  colonnade of vertical banners" beat. (Codrops "Infinite Tubes", spline-camera rigs.)
- **Velocity-reactive depth gallery** — *superb.* Each clip carries its own palette; scroll velocity
  drives feel; the environment recolors to each ad's grade. (Codrops "Scroll-Reactive 3D Gallery
  with mood-based backgrounds".)
- **Hover-to-play → click-to-expand** — *essential detail-view.* Muted autoplay on hover; click
  dollies in, panel unfolds full-bleed with sound. (Obys.)
- **Displacement-shader cut between clips** — *your "cut".* Use as clip-to-clip transitions, not
  layout. (Codrops/curtains.js/OGL lineage.)
- **Infinite draggable X/Y grid** — *fine as a secondary "index" view;* reads as a wall of phones if
  used as the main stage.
- **Sphere/globe of screens** — *striking hero, but portrait tiles distort on a sphere* → prefer a
  **helix/DNA of banners.**
- **Physics clusters / floating fragments** — *great "shuffle"/empty-state gesture,* risky for video
  legibility as a primary layout. (Note: no physics engine in your shipped repos yet — this would be
  new.)
- **Marquee / conveyor river** — *strong footer "reel ticker";* too passive as the main stage.

**Composite recommendation:** cylindrical drum (primary) + click-to-expand dolly (case study) +
displacement cuts (transitions) + velocity-reactive grade (atmosphere). One coherent system.

### 4.3 The opening (first 5 seconds)

Do **not** open on a grid. Earn "wow" with a **single hero moment** that then reveals scale: a real
0→100 loader (genuinely warming WebGL, not fake) over one full-bleed vertical hero film → the camera
**pulls back from that one screen to reveal it was one panel among a hundred** (the drum / colonnade).
Signals cinematic taste *and* engineering in one gesture.

### 4.4 Narrative, type, sound

- **Structure:** chapter **by vibe/material, not client** — e.g. *Light* (perfume/jewelry),
  *Motion* (footwear/fashion film), *Macro* (product close-ups), *Cairo* (Luxor/desert/bazaar as
  cultural signature). Case studies open **without a page break** — click dollies the camera in; a
  side rail reveals brief, tools, stills; immersion never drops.
- **Typography as cinema:** MSDF WebGL text that scales/parallaxes; morphing kinetic type.
  **Bilingual Latin + Arabic** as identity, not translation.
- **Sound as a layer, not decoration:** one ambient bed + per-clip audio on focus; a persistent,
  tasteful mute control. (Cartier's Web Audio score is the model.)

---

## 5. Three concept directions

### Concept 1 — "The Cutting Room" ⭐ recommended
A dark editorial atelier. A **rotating cylindrical drum of 9:16 panels** spun with inertia; click →
camera dollies in, the panel unfolds to full-bleed film + sound; chaptered by material; bilingual
kinetic type; **velocity-reactive color grade**; Luxor-colonnade cultural skin for the "Cairo"
chapter. *Lowest risk, highest craft-to-effort — and it reuses your okhtein video primitive almost
directly.*

### Concept 2 — "Wrapped for Brands"
A linear, scroll-sequenced **cinematic title sequence** (Spotify Wrapped model) that walks a visitor
through your best beats as full-screen vertical moments, craft/tool captions animating in, ending on
a hire CTA. *Most "story", most guided, least exploratory. Strong if the goal is a guaranteed
3-minute narrative for busy clients.*

### Concept 3 — "The Souk of Screens"
An explorable 3D **city/bazaar of vertical billboards and lantern-screens** (Times-Square-meets-Cairo)
you fly/scroll through; hover-to-play, click-to-enter a vitrine; physics-lit, sound-reactive.
*Highest wow ceiling and highest performance risk — mobile budget is the gate; also the most new code
(physics + large scene streaming).*

> A pragmatic path: **ship Concept 1**, and treat the Concept-3 "souk" as a possible *finale
> chapter* once the video pipeline is proven.

---

## 6. Technical architecture — the three-tier hybrid

The naive approach (90 GPU video textures, or 90 `<video>` elements) **will not work** — it blows
past every browser limit in §7. The proven architecture is a **three-tier hybrid** where 99% of the
"wall of work" is cheap posters and only a *handful* of clips ever decode at once:

**Tier 1 — Stills-first grid (the wall).** Render all ~430 images and all ~90 clips as **poster
thumbnails** (AVIF/WebP, ≤40–80 KB each). Cheap DOM `<img>` or lightweight instanced quads. This is
what delivers the "so much work" wow at *zero* video cost. Nothing decodes until you ask it to.

**Tier 2 — A small pooled video layer.** Keep a **media pool of ~4–8 recycled `<video>` elements**.
A shared `IntersectionObserver` plays a clip only when its tile is hovered / focused / centered, then
swaps poster → video; on exit, pause and **release the element back to the pool**. You never exceed
the pool's worth of concurrently decoding clips, no matter how many tiles scroll past.

**Tier 3 — The WebGL hero stage (R3F).** 1–4 featured clips at a time on curved planes with depth,
displacement transitions, and shader FX. This is where you spend the GPU budget and win the award;
the grid stays in the DOM/CSS layer where it's cheap and accessible.

**Rendering rule of thumb:** plain `<video>` (or CSS) for flat, axis-aligned tiles — cheaper,
natively accessible, no per-frame texture upload. Reserve `THREE.VideoTexture` / drei
`useVideoTexture` for anything with 3D transform, curved geometry, depth, or a shader (your hero
stage — exactly the okhtein pattern you already shipped).

Everything degrades to a **lite mode** (posters + tap-to-play, no autoplay, 2D) on weak devices,
iOS Low-Power Mode, or `prefers-reduced-motion`.

**On `useVideoTexture` (drei):** preferred over hand-rolled — it auto-sets `colorSpace` (avoids the
washed-out/dark bug), defaults `muted / playsInline / loop / crossOrigin`, Suspends on
`loadedmetadata`, and ships hls.js + `requestVideoFrameCallback` hooks. Power-of-two is a non-issue on
the WebGL2 stack you're on. Two live gotchas: `VideoTexture` uploads to the GPU **even while paused**
(drive updates via `requestVideoFrameCallback` and stop on pause — a `VideoFrame` path is ~5×
faster); and iOS 18.5+ can show a **black texture** with `start:false` (start `true`, gate by
visibility instead).

## 7. The "many videos" problem (the real engineering)

**Hard caps you must design under:**
- **Chromium blocks new players past 75/frame desktop, 40 mobile** ("Too many WebMediaPlayers").
- **iOS 14+** allows multiple muted inline videos, but true concurrency is gated by a **small number
  of hardware decoders + a ~300–500 MB page/WebGL memory ceiling**. *The exact simultaneous-decode
  number is undocumented and device-dependent — treat "a handful" (≈4–8) as the safe ceiling.*
- **iOS Low-Power Mode disables autoplay entirely — even muted.** You **must** catch the `play()`
  promise rejection and fall back to poster + an explicit play affordance. (Non-negotiable; a huge
  share of phones browse in Low-Power.)

**Autoplay recipe:** `muted + playsinline + autoplay` (or no audio track). iOS auto-pauses
off-screen. Always pair with a poster and a real fallback.

**Memory:** keep the iOS page under ~384 MB. A single 4K uncompressed texture is **64 MB** —
downscale every video/still texture to **≤1024 px**, use **ASTC-compressed** textures for stills,
prefer `InstancedMesh` for the grid, and **stop texture uploads on pause**. Cap concurrent decodes to
the pool size.

**Accessibility (also an Awwwards judging axis):** honor `prefers-reduced-motion` (`matchMedia`), and
per **WCAG 2.2.2 (Pause, Stop, Hide)** always expose a pause control for any autoplay > 5s.

**Shader FX on video:** fully feasible — a video texture is just a `sampler2D` refreshed per frame,
so RGB-shift / displacement / hover-distortion work **identically to stills**. The only extra cost is
the decode+upload you're already paying, so keep shader-video to the hero stage (Tier 3) and feed it
the `VideoFrame` fast path.

## 8. Hosting, delivery & encoding

**GitHub Pages is out for the media** — this is the one place you must break from your usual deploy.
GH Pages has a **100 MB hard per-file cap, ~1 GB repo limit, and does not serve Git LFS** (broken
pointers). Your library is several GB.

**Recommended split:**
- **App shell → Cloudflare Pages** (static Next export; 20,000 files, 25 MiB each — plenty for
  JS/CSS/posters). Keeps your static-export workflow intact.
- **Media (clips + full-res stills) → Cloudflare R2** — **$0.015/GB/mo storage and *zero* egress
  fees** (one case study served 15 TB of 4K for ~$2/mo). Bunny CDN is a comparable cheap alt.
- If you later want adaptive/managed transcode: **Cloudflare Stream**, **Mux**, or **Bunny Stream**
  (verify current pricing at build time — it moves).

**Delivery hygiene:** MP4 with **`+faststart`** (moov atom front → instant start + HTTP range seek),
poster thumbs, `preload="none"` + `loading="lazy"`, and **preload the next clip on hover intent**.
Route every media URL through your existing `withBase()` (point it at the R2/CDN origin).

**Encoding cheat-sheet (ffmpeg):**
```bash
# Universal baseline — H.264 High, 8-bit yuv420p, silent loop, seekable
ffmpeg -i in.mov -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -crf 23 -preset slow -g 48 -keyint_min 48 -sc_threshold 0 \
  -an -movflags +faststart -vf scale=1080:1920 out_h264.mp4     # 720:1280 for grid tiles

# Progressive-enhancement alternates (never the ONLY source)
ffmpeg -i in.mov -c:v libsvtav1 -crf 30 -preset 6 -pix_fmt yuv420p -an out_av1.mp4      # smallest
ffmpeg -i in.mov -c:v libx265 -tag:v hvc1 -crf 28 -pix_fmt yuv420p -an -movflags +faststart out_hevc.mp4  # Safari

# Poster
ffmpeg -i out_h264.mp4 -frames:v 1 -q:v 3 poster.jpg   # → convert to AVIF/WebP
```
`<source>` order best→fallback: **AV1 → HEVC → H.264**. Attributes: `muted playsinline loop
preload="none" poster="…"`. **8-bit `yuv420p` is mandatory** (10-bit/444 won't decode widely). Grid
posters ≤ ~80 KB AVIF; hero clips 720–1080p, CRF 23–28, ~0.3–1.5 MB each; keyframe every ~1–2 s for
smooth scrub.

## 9. Risks & mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Too many videos → stalls/black/crash | High | Three-tier hybrid; poster-first; 4–8 element media pool; only-play-in-view |
| iOS Low-Power kills autoplay | High | Catch `play()` rejection → poster + play button; lite mode |
| Mobile GPU memory / fps | High | ≤1024px textures, ASTC stills, InstancedMesh, tiers (SAFE/STD/HIGH), stop-on-pause |
| Vertical clips read as "wall of phones" | Med | Curvature + architectural framing (colonnade/drum), generous negative space + type |
| Hosting: GH Pages can't serve the media | Med | Cloudflare Pages + R2 (cheap, zero egress) — a deliberate change from your usual GH Pages |
| "It's AI" skepticism | Med | Own it — position as *AI-native cinematic direction*; show the craft (reference-lock → frame → grade), don't hide it |
| Scope creep (the "souk") | Med | Ship Concept 1 first; souk is an optional later chapter |
| Content overload (525 assets) | Low | Curate to the best ~24–40 clips; the 432 stills are the poster wall, not all foreground |
| Headless-verify blind spots | Low | Verify video **headed on the real GPU** (H.264 won't decode in SwiftShader; unfocused-tab rAF freeze) |

## 10. Phased roadmap (when you decide to build)

- **Phase 0 — Decide** (§11). Lock concept, hosting, v1 scope, brand/domain. *(Your `awwwards-architect`
  Gate 1.)*
- **Phase 1 — Asset pipeline** (can start immediately, low-risk, parallelizable). Curate the best
  ~24–40 clips + poster stills; batch-encode H.264 baseline (+ AV1/HEVC alternates) with the cheat-sheet;
  generate AVIF posters; upload to R2; produce a `manifest.json` (id, chapter, aspect, poster, sources,
  grade-color, brief). *(You already have the raw manifest of all 525 from this research.)*
- **Phase 2 — Scaffold.** Fork your okhtein/perfumes scaffold: `deviceTier`, one-clock `SmoothScroll`,
  `Preloader`, `CustomCursor`, `withBase`→R2, `ExperienceBoundary`, `?debug=1`, deploy/audit/profile/shot
  scripts. Swap deploy target to Cloudflare Pages.
- **Phase 3 — The signature.** Build the cylindrical drum of 9:16 panels (inertia drag/scroll) + the
  poster grid (Tier 1) + the 4–8 element media pool (Tier 2). Prove it holds 60fps on your Iris Xe and a
  real phone *before* adding polish.
- **Phase 4 — Cinema layer.** Click-to-expand camera dolly (Obys bloom) + displacement-shader cuts +
  velocity-reactive color grade + bilingual kinetic type + sound (ambient bed + per-clip on focus, mute
  control).
- **Phase 5 — Identity & hero.** The pull-back opening reveal; the Cairo/Luxor colonnade chapter; the
  case-study side rail (brief/tools/stills).
- **Phase 6 — Harden & ship.** Tier fallbacks, Low-Power/reduced-motion lite mode, WCAG pause control,
  mobile memory budget; headed real-GPU verify; ship. *(Gate 2 + your 11-axis rubric.)*

## 11. Open decisions for you

1. **Concept** — Concept 1 "The Cutting Room" (recommended) / Concept 2 "Wrapped for Brands" /
   Concept 3 "The Souk of Screens"? (Or C1 now, C3 as a later chapter.)
2. **Hosting** — Cloudflare Pages + R2 (recommended) vs. a managed video CDN (Stream/Mux/Bunny)?
   GH Pages alone is not an option for the media.
3. **v1 scope** — how many clips foreground (rec ~24–40), and which chapters (Light / Motion / Macro /
   Cairo — or by client)?
4. **Brand & domain** — personal name vs. a studio identity? Bilingual (Latin + Arabic) treatment?
5. **Sound** — off-by-default with a prompt to enable (recommended), or an audio-led experience?
6. **Effort appetite** — a tight 2-week signature slice, or the full chaptered experience?

---

### Appendix — research provenance
- Live census of your Higgsfield workspace (525 generations; `manifest.json` retained in the session
  scratchpad with prompts + CloudFront URLs).
- Direct visual review of representative frames across jewelry / STOLCH-Luxor / invisible-wearer.
- Survey of your shipped R3F repos (okhtein, perfumes, Electrico, ras-el-hekma, hadia-ghaleb) + the
  `awwwards-architect` skill.
- Two deep web-research passes (technical feasibility; award references & patterns) — all source URLs
  are inline in §4 and §6–§8 of the working notes.
- **Flagged uncertainties:** exact iOS simultaneous-decode count (undocumented → assume ~4–8);
  managed-video pricing moves (verify at build); recent Safari-18 / drei-iOS-18.5 video quirks may
  shift.
