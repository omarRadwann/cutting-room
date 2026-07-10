# The Cutting Room — Luxury-3D Playbook
### How to take the gallery from "flat WebGL" to Awwwards screening-room — research + build plan
> Investigation phase (building paused until the bespoke hero video lands). Grounded in: our own award-3D
> reference library + the teardown of four Awwwards winners (Cartier, Oryzo/Lusion, Lando, Mana), plus
> four fresh research threads (lighting/shadows, colour/grade, materials/framing, Blender pipeline + refs).
> Target GPU: **Intel Iris Xe (STANDARD tier)** — every recommendation is costed against it.

---

## PART 1 — The honest diagnosis: *why it reads boring* (code-grounded)

Not a vibe — five specific, fixable causes, each tied to the actual code and to a scored rubric axis.

1. **The films are unlit flat stickers.** Every poster/video is `MeshBasicMaterial` (`VideoPanel.tsx`,
   `toneMapped={false}`). `MeshBasic` **ignores all lighting** — so none of the "studio lights" ever touch
   the images. They can't look premium because they don't live in the room; they're emissive quads floating
   over a lit set. *(Rubric fail: Lighting, Materials, Depth.)*
2. **Ten identical, evenly-spaced rectangles** on a cylinder = the rubric's **telescoping-rhythm failure**:
   "one tile stamped N times, evenly spaced → the long walk reads as a single repeated frame … photographs
   like a folded paper snowflake." Uniform width/height/spacing is *literally* the definition of monotonous.
   *(Rubric fail: Composition, Scale, Emotional impact.)*
3. **The room is an empty void** — a gradient dome + a reflector floor, no set, no architecture, no
   foreground/midground/background layers. Luxury is a *built world*, not a backdrop. *(Rubric fail: Depth,
   Balance/negative-space, No-black-void.)*
4. **The "spotlight" is a fake additive cone** — flat, unoccluded, ungraded; it glows uniformly even where a
   panel should block it. It reads "2016 WebGL," not "screening room." *(Rubric fail: Lighting, Shadows.)*
5. **One monotone warm grade.** The room is warm-gold and the AI clips are *already* warm-orange with blown
   highlights — so warm-room + warm-films = the exact "generic warm-orange AI reel" we're trying to escape.
   No tone-curve discipline, no per-film colour world, no restraint. *(Rubric fail: the whole colour story.)*

**The through-line:** *nothing in the scene shares a lighting or colour model*, so it reads as flat stacked
layers instead of one lit, graded room. Fixing that unity is the whole game.

---

## PART 2 — What "luxury/premium 3D" actually is (the principles)

From the four-winner teardown and the art-direction method — luxury is **restraint + baked craft + one authored idea**, not more effects.

- **Bake everything you can.** Cartier bakes EXR/IBL per material; Oryzo bakes spherical-harmonics lighting
  *and* the camera move. Offline-render quality, frozen into textures, played at 60fps. Real-time cost is
  spent only where the eye is.
- **One bold accent on a near-mono base.** ~90% deep near-black, ONE signature colour used sparingly. Colour
  from a *world*, not a palette ramp.
- **Restraint signals luxury.** What you hold back — sound behind one toggle, a hidden gesture, motion that
  eases rather than shouts — reads more expensive than what you add. The *finish* is 30% of perceived quality.
- **A 2D craft layer over the 3D.** Razor type (MSDF/DOM) carries legibility; the 3D carries depth + emotion.
- **One clock, real materials, real light response.** Every winner puts real IBL + tone mapping under the
  hero surface so metal/gold reads as *photography*, not GL.
- **The scorecard to build against** (score each dwell + transition frame /10; fix anything < 9): Composition,
  Depth, Scale, Lighting, Shadows/contact, Materials, Reflections, Camera, Motion, Readability, Emotional
  impact. Plus the named fixes: figure/ground at the climax, no-black-void, reveal-gate, product-dominance,
  **telescoping rhythm**, copy-off-the-focal-object, balanced anti-symmetry, active negative space.

---

## PART 3 — Lighting & shadows (the biggest visual ROI)

The "expensive" look = four stacked moves, none of which is a raw real-time dynamic light + default shadow map
(that combo is exactly what reads "cheap WebGL"):

### 3.1 Soft area lighting via an Environment + Lightformer softbox rig — **do this first**
Our metal frames are the luxury surface, but with a weak env they have nothing to reflect → grey plastic.
Build a *photo studio inside the environment map*: dark near-black background + 2–3 bright emissive
`<Lightformer>` bars/rings. As the drum **rotates**, the frames sweep bright specular highlights across their
bevels — **this single change is what makes it read "expensive."**
```jsx
<Environment resolution={256} frames={1}>            {/* baked to a cubemap ONCE → effectively free */}
  <color attach="background" args={['#0a0a0c']} />
  <Lightformer form="rect" intensity={6} scale={[10,3]} position={[0,5,-4]} target={[0,0,0]} />
  <Lightformer form="ring" intensity={3} scale={[3,3]} position={[-5,2,2]} />
  <Lightformer form="circle" color="#ffd9a8" intensity={2} scale={[2,2]} position={[5,1,3]} />
</Environment>
// frames become MeshStandardMaterial{ metalness:1, roughness:0.25–0.4, envMapIntensity: tuned }
```
- `RectAreaLight` (via `RectAreaLightUniformsLib.init()`) is the alternative "studio softbox" primitive — soft
  photographic falloff + specular streaks — but **it cannot cast shadows** and costs LTC math per fragment.
  Keep to 1–3. The Lightformer/Environment rig is higher-ROI on Iris Xe (baked once).

### 3.2 Exploit the drum's symmetry → a **frozen** contact shadow (free grounding)
A drum rotating about its **vertical axis has a rotationally-invariant footprint** — its top-down shadow never
changes. So skip live shadows: `<ContactShadows frames={1} resolution={512} blur={2.5} opacity={0.8} />`
renders once, then costs **zero forever**, and grounds the drum far better than the reflector alone. (Rare case
where a moving object can still use a frozen shadow — take it.) For a *static* hero prop, `<AccumulativeShadows
temporal>` + `<RandomizedLight>` gives raytraced-quality soft shadow then freezes. **Skip `<SoftShadows>`
(PCSS)** — it recompiles every shader in the scene and is the most expensive option; we don't need it.

### 3.3 Replace the additive cone with a real gobo spot + medium + motes
- One shadow-casting `SpotLight` with `penumbra={1}` and a **`.map` cookie** (film-strip perforations / slats /
  soft round lens) projected down — instant "projector in a screening room." The `.map` projection is nearly free.
- `<fogExp2 args={['#08080b', 0.05]} />` gives the beam a medium to scatter in (cheapest big win).
- `<Sparkles count={60} speed={0.15} size={2} opacity={0.35} />` = dust drifting in the beam (almost free).
- True shafts: `three-good-godrays` (samples the shadow map → the beam is *genuinely occluded* by the panels) at
  **half-res, samples ≤ 40**. On Iris Xe test fog+Sparkles+Bloom first; it may already be enough.

### 3.4 Tame the reflector floor (our single biggest GPU cost)
`MeshReflectorMaterial` re-renders the scene every frame. On Iris Xe: `resolution` 256–512, `blur=[400,100]` +
`mixBlur`, low `mixStrength`/`metalness` (0.3–0.5) → a semi-gloss **sheen**, not a chrome mirror. A tighter,
blurrier reflection is both **cheaper and classier** (luxury floors are polished stone, not mirrors).

### 3.5 Make the video planes belong to the room
Keep them `MeshBasic` (video is emissive by nature) but: (a) add a thin **emissive rim/bezel** so the film
appears to spill light onto its frame; (b) route them through **Bloom with a high threshold** so only the
*bright parts of the footage* glow — that glow is what reads "cinema screen" instead of "texture on a quad."

### 3.6 Upgrade the dome
Add **dithered noise** to the gradient (kills CG banding); darken it; add a soft **radial hotspot behind the
drum** (a cyclorama/infinity-wall glow that separates the drum from the black). Optionally let the dome double
as the environment so it lights the scene edges.

---

## PART 4 — Colour & cinematic grade (restraint is the luxury)

**The named trap:** our AI clips already ship the warm-orange, blown-highlight "AI reel" grade. A warm-orange
room compounds it. Two moves fix it — **cool the room, run everything through one tone curve** — and a LUT+grain
wash makes it cohere.

### 4.1 Switch to AgX tone mapping (the current "expensive maison" curve)
`AgXToneMapping` (three r160+) rolls clipped highlights off to a **desaturated cream** and *holds hue* → warm
sources look like *film overexposure*, not neon AI blowout. ACES (our current setting) buys contrast by
distorting hue toward yellow and crushing saturation — on already-warm content it makes everything the same
orange. Use **Neutral** only where exact brand colour must survive (jewellery/product macro).
```jsx
<Canvas gl={{ toneMapping: THREE.AgXToneMapping, toneMappingExposure: 1.0 }} />
// under EffectComposer, move tone mapping to the END: <ToneMapping mode={ToneMappingMode.AGX} /> and set
// the renderer to NoToneMapping so you don't double-grade.
```

### 4.2 Cool the room so the films are the only warmth
Grade the environment to a **deep warm-neutral near-black** (`#0B0A09`, faint warm tint — never pure `#000`)
with cool, slightly teal-leaning shadows. Now every clip's warmth becomes the site's **single hero accent** —
*the films are the gold.* Warm room + warm films = mush; cool room + warm films = a lit gallery.

### 4.3 Run the clips through the SAME tone mapper (the cohesion trick)
`videoTex.colorSpace = THREE.SRGBColorSpace` (the #1 "cheap" bug if forgotten — clips come in dull/dark), and
leave the material `toneMapped:true` so AgX processes **clips and room identically**. One response curve over
everything is what unifies footage from different AI models into one graded world.

### 4.4 One subtle LUT wash + film grain over the whole composite
A single restrained `.cube` LUT (`<LUT tetrahedralInterpolation>`, mix ~0.5–0.7, authored in DaVinci Resolve)
+ `<Noise premultiply opacity={0.03}>` grain over the entire frame makes disparate clips read as *one
colourist's film* and masks the AI clips' compression banding. **Placement:** LUT runs *after* tone mapping +
sRGB (`Bloom → ToneMapping → LUT → Vignette/Grain`) or the grade lands on wrong values.

### 4.5 Post discipline (the line between "maison" and "gamer RGB")
Every effect barely perceptible. `Bloom` `luminanceThreshold≈1.0`, `intensity≈0.3–0.4`, `mipmapBlur` (emissive
/specular ONLY, never diffuse white); subtle `Vignette` (darkness 0.5–0.7); `HueSaturation ≈ −0.08` (pulling
saturation *down* is instant "expensive"); CA `offset ≤ 0.0005` if at all; **DOF only on a hero beat** (it's
expensive on Iris Xe); `SMAA` for AA. Perf note: the entire grade stack is nearly free — **video decode is the
real cost** (pause offscreen clips, ≤2–3 playing, ~720p, `generateMipmaps=false`); skip DOF/SSAO/SSR/TAA.

---

## PART 5 — Materials & framing: turn each film into a *precious object*

This is the fix for cause #1 (flat stickers). A `MeshBasicMaterial` clip is *unlit* — no specular, no fresnel,
no rim, no env reflection — a decal floating in space. Stop treating the clip as a surface; treat it as an
object in a room. Premium sites stack six cheap cues (rebuild **per panel**):

1. **Lit, self-emissive screen (not basic).** Video on `MeshStandardMaterial` as **both** `map` *and*
   `emissiveMap`, `emissive="#fff"`, `emissiveIntensity ≈ 0.7`, **`roughness ≈ 0.45`**, `metalness 0`,
   **`toneMapped: true`**, `videoTex.colorSpace = SRGB`. The `emissiveIntensity` makes it glow like a display;
   keeping it tone-mapped keeps it in the room's AgX response (so it doesn't blow to that flat-sticker
   over-bright); the non-zero `roughness` lets it *catch the same soft specular streak the glass and frame do*
   — that shared highlight is what unifies screen+frame+glass into one object. (`toneMapped:false` only for a
   clip meant to read as a raw neon light, not a framed work.)
2. **Fresnel glass cover pane — the single biggest upgrade, and it's FREE.** Float a thin pane a few mm in
   front: `meshPhysicalMaterial transparent opacity={0.06–0.1} roughness={0.05} clearcoat={1} ior={1.45}
   envMapIntensity={2.2}` — **no `transmission`** (no extra pass). It reflects the `<Lightformer>` softboxes as
   a soft ~30° diagonal streak and brightens edges at grazing angles. That streak is exactly how the eye tells
   "framed glossy print behind glass" from "sticker."
3. **Real beveled frame geometry** — a `RoundedBox`/extruded profile in **brushed metal** (`metalness 1,
   roughness 0.35, anisotropy 1` for hairline grain) or **piano-black lacquer** (`clearcoat 1`). A flat textured
   "frame" won't catch light; the *bevel* bends the key light into a bright edge. Inset the screen ~5 mm behind
   the frame face → the frame casts a soft shadow on the image (depth + "matted print").
4. **Velvet mat** — a recessed inner border with a `sheen` material (charcoal velvet) or matte off-white. The
   passe-partout says "this deserves room" — pure museum-preciousness signal.
5. **A grazing rim light** — one `<Lightformer>` strip / low `SpotLight` skimming the top edge so the bezel +
   glass edge glow. In a dark room that thin rim is the line between "object" and "cutout."
6. **Parallax for free** — glass, image, and frame sit at different Z, so small camera moves slide the glass
   streak over the recessed image = the strongest "real thing in space" cue, at zero cost.

**`MeshPhysicalMaterial` luxury layers** (all but transmission are cheap): `clearcoat`+`clearcoatRoughness`
(lacquer/wet stone), `sheen`+`sheenColor` (velvet/satin), `anisotropy`+`anisotropyRotation` (brushed/spun
metal), `iridescence` (pearl/anodized/jewel), `specularColor` (tinted gold/copper). **`envMapIntensity` 1.5–3.0
is the master "expensive-metal" volume knob** — but it only does anything once an env map exists (Part 3.1).

**Real refraction is a luxury you spend ONCE.** `<MeshTransmissionMaterial>` forces a **separate full-scene
render pass per material** — 10 transmissive panels = dead Iris Xe. Use the free fake-glass (#2) on all panels;
reserve true `transmission` for the **hero panel only** at `resolution={128} samples={2} transmissionSampler`
(one shared buffer). A little `roughness` (0.1–0.2) makes low-res read as *frosted*, not pixelated.

**Reflections decision:** env-map (baked, ~free) is the default; `<MeshReflectorMaterial>` floor is **one pass
for all 10** panels (`resolution 512, blur [300,100], mixStrength 0.5, roughness 0.9, dark color` = a soft
polished-stone sheen, not a funhouse mirror — blurrier is *both* cheaper and classier); `CubeCamera frames={1}`
if a curved piece must reflect the specific static scene. Never per-panel CubeCamera.

**Museum/vitrine language → scene rules:** one object per plinth; **chiaroscuro** (70–80% of frame dark, one
spotlit hero); picture-light at **~30°** (one controlled glass streak, not a blown mirror); wide **mat**;
**warm high-CRI** light (`#fff2e0`, never clinical blue-white); a small letter-spaced **placard** (title · year
· medium) under the hero — that one typographic convention screams "curated, not content."

**The "wall of phones" antidote** (equal-sized, equally-bright, gridded, autoplaying tiles = app-store feed):
impose **hierarchy** (one hero, deferential neighbours); give every clip a **physical body** (the 6-cue stack);
**dark controlled room**; **one grade** across all clips (they become one body of work); **weighty eased
motion**; and **freeze the crowd** — play video only on the hero (± its two neighbours), freeze the rest to
poster stills. Stillness is *both* a luxury signal and a big decode/battery/Iris-Xe win. *(Our `VideoPanel`
already mounts video only for the active panel — this is aligned; extend to "hero + neighbours" and swap the
screen material from `MeshBasic` → the lit `MeshStandard` above.)*

---

## PART 6 — The Blender pipeline (the "real light & shadow objects" you asked about)

Yes — Blender is exactly the right tool for the light/shadow/set craft. The move is **bake in Cycles, ship
textures.** Cycles path-traces *all* the bounces offline (colour bleed, soft AO, wrapping GI — which real-time
three.js simply doesn't have), and you freeze that into a texture. You ship offline-render quality at 60fps.
This is Bruno Simon's whole warm look, and it's the ideal strategy for Iris Xe (lighting cost moves to build time).

**What to build & bake for *this* site:**
- A **static "cutting-room" set shell** — walls / floor / a ceiling softbox grid / a colonnade or editing-suite
  architecture — GI + AO **baked** into a lightmap. The room itself becomes expensive; the **drum stays
  dynamically lit by the env rig** (it rotates, so it can't be baked).
- **Real set pieces:** beveled frames, velvet mats, plinths, vitrines, a hero set piece for the opener.
- A **studio softbox / IES / HDRI** lighting rig, baked to the lightmap for diffuse GI, plus a small HDRI kept
  as `scene.environment` so metal/glass frames still get **live** speculars as the drum turns (baked GI free,
  cheap speculars live).

**Bake workflow (Cycles):** give each object 2 UVs — UV0 = textured/tiled, **UV1 = non-overlapping lightmap UV**
(Lightmap Pack, **≥4 px margin** or seams bleed). Add an Image Texture node, make it active, bake **Combined/
Diffuse** (GI) → lightmap, **AO**, and **Normal** (Selected-to-Active low←high poly, tune Max Ray Distance / use
a Cage). Test at **512 / 1 spp** first to catch black faces + bad UVs, then final at **2–4K / ~128 spp /
denoise**, GPU. Bake with the **Standard** view transform (not Filmic/AgX) so intensities match three's tone
mapping. Fix normals first — inverted normals bake **solid black** (the #1 black-mesh cause).

**Export + compress (CLI — never Blender's Draco checkbox, it under-compresses ~33% vs ~97%):**
```bash
gltf-transform optimize in.glb out.glb --compress draco --texture-compress ktx2
# fine control: uastc on detail maps, etc1s on colour
gltf-transform uastc a.glb --slots "{normalTexture,occlusionTexture,metallicRoughnessTexture}" --level 4 --rdo --zstd 18
```
Draco = best static-geometry ratio; **meshopt** if you need morph/keyframe animation compressed too.

**Wire the baked maps in three.js/R3F:**
```js
mat.lightMap = lm;  mat.lightMap.channel = 1;  mat.lightMapIntensity = 1;   // r151+: uv2 no longer auto-used —
mat.aoMap   = ao;   mat.aoMap.channel   = 1;   mat.aoMapIntensity  = 1;     // set the channel explicitly
// colour space: lightMap = linear/assigned, aoMap + normalMap = NoColorSpace, baseColor map = SRGB
// glTF textures need flipY = false; aoMap/lightMap CANNOT carry offset/repeat (UV0 only)
```
KTX2 loader must be wired **before** load: `new KTX2Loader().setTranscoderPath('/basis/').detectSupport(renderer)`
then `gltfLoader.setKTX2Loader(...)`. In R3F, `useGLTF` has no built-in KTX2 — attach via `extendLoader` and
reuse **one** decoder (multiple = "Multiple active KTX2 loaders" WASM warning). Draco decoder runs in a Worker:
copy `three/examples/jsm/libs/draco/` into `/public/draco/` and `setDecoderPath('/draco/')`.

**Gotchas checklist:** glTF is Y-up (exporter converts — don't double-rotate; apply transforms first) · missing
`TEXCOORD_1` → black lightmap · wrong colour space → washed/muddy · `flipY=false` on external glTF textures ·
lightmap too bright/dark = Blender-view-transform vs three-exposure mismatch (bake Standard, tune
`lightMapIntensity`) · denoiser seam lines along UV islands (raise margin) · **baked = static** (nothing baked
can move — keep set/drum-shell static, animate camera + live env). Cross-ref our **Blender-headless gotchas**
(EEVEE id in 5.1, boolean solver eats coplanar/tangent cuts → build profiles with bmesh, vertex-AO bake recipe).

**Iris Xe budget from the Blender side:** target **< 100 draw calls** (instance repeated frames/columns via
`InstancedMesh` + a texture atlas), **≤ 3 real-time lights** (bake the rest), shadow maps 512–1024 or a fake
contact plane (`shadowMap.autoUpdate=false` for static), **KTX2 ≈ 10× less VRAM**, DPR ≤ 1.5, `dispose()`
off-screen, watch `renderer.info`.

---

## PART 7 — The 5 signature moves (what will actually make it feel Awwwards-luxury)

Ranked by impact-per-GPU-dollar on Iris Xe. Each cites the reference that proves it.

1. **Environment + Lightformer softbox rig with real metal/glass frames.** Frames become `MeshStandard`
   metal; a dark studio env with 2–3 bright bars reflects across their bevels + the glass covers, so the reel
   **sweeps living specular highlights as the drum turns.** The single change that reads "expensive," and it's
   baked-once (near-free). *(Lusion, Cartier.)*
2. **Rebuild every panel as a framed vitrine object** (Part 5's 6-cue stack: lit emissive+rough screen →
   recessed velvet mat → beveled metal/lacquer frame → fresnel glass cover reflecting the softboxes → grazing
   rim → parallax). The drum stops being a carousel of screens and becomes a **rotating turntable of framed
   works.** *(Louis Vuitton Collectibles; museum vitrine language.)*
3. **Break the telescoping rhythm + give the drum real weight.** Stagger panel spacing *and* scale toward the
   front; the front film is the **hero** — larger, brighter key, DOF-focused, a placard beneath — while
   neighbours dim, desaturate, and **freeze to stills**. Rotation carries velocity + inertia + friction (our
   free-rest is the foundation), slow and eased, never a constant spin. Kills "xeroxed tiles"; adds "one object
   with weight." *(Oryzo/Lusion; Codrops scroll-driven circular carousel, Dec 2025.)*
4. **One unified filmic grade + real volumetrics.** AgX tone-map + cool near-black room + a single LUT + film
   grain over the whole composite makes ten AI clips read as one colourist's film; replace the additive cone
   with a **gobo `SpotLight` + `fogExp2` + `<Sparkles>`** (and, if the budget allows, half-res shadow-sampled
   `three-good-godrays` so the panels cut real streaks in the beam). *(Cartier grade; screening-room volumetrics.)*
5. **A built world + cinematic camera + a whisper of craft.** Bake a static "cutting-room" set shell (GI+AO
   lightmaps, Blender→KTX2) so the room itself looks GI-lit; a slow **dolly + focus-pull** onto the front film;
   **oversized editorial type locked to the active panel** (title · frame number moving as one with the 3D);
   and a low Web-Audio hum with a soft **detent click** when a film snaps to front. *(Bruno Simon baking; Lando
   Norris type-over-3D; Cartier narrative sound.)*

**The signature interaction** (the thing people screenshot): a **film-to-film shader dissolve** when the front
film changes — our shader-cookbook mesh/dither dissolve driven by the same scroll/selection clock — so switching
works is a cinematic cut, not a hard swap.

---

## PART 8 — Prioritised build roadmap (ready for when the hero lands)

**P0 — cheap, highest impact (do first, all near-free on Iris Xe):**
- Environment + Lightformer softbox rig; convert frames to real metal (`metalness:1`, tuned `envMapIntensity`).
- **Swap the film screen material `MeshBasic` → lit `MeshStandard`** (`map` + `emissiveMap`, `emissiveIntensity
  ≈0.7`, `roughness ≈0.45`, `toneMapped:true`) so the films finally live in the room's light. *(This is cause #1.)*
- Switch ACES → **AgX**; cool the room to warm-neutral near-black; set `videoTex.colorSpace = SRGB`.
- Frozen `<ContactShadows frames={1}>` under the drum; blur/soften the reflector (res 256–512, low mixStrength).
- High-threshold Bloom (emissive/video only) + subtle Vignette + fine grain; dither the dome + add cyclorama hotspot.

**P1 — the "100×" character (medium effort):**
- Break telescoping rhythm (stagger spacing + scale; hero panel larger/brighter/DOF; neighbours dimmed).
- Real gobo SpotLight + `fogExp2` + `<Sparkles>` replacing the additive cone.
- **Free fresnel glass-cover pane** per film + velvet mat + beveled frame (Part 5); real transmission on the
  hero only. One LUT wash + grain over the whole composite.
- **Freeze non-hero panels to poster stills** (play video on hero ± neighbours) — luxury *and* a big decode win.
- Wire the bespoke **hero.mp4** as the cinematic opener (layer already built).

**P2 — the built world (Blender, highest craft):**
- Bake the static room shell (GI + AO lightmaps → KTX2); model vitrines/plinths/set; optional god-rays (half-res).
- Signature film-to-film **shader dissolve** transition; layered sound (gesture-unlocked); "drum assembles on load."

**Honest tradeoffs:** the P0 env-rig + AgX + frozen shadow trio moves it from "flat WebGL" to "luxury screening
room" without threatening the frame budget. Baked GI makes the *room* expensive but the drum must stay env-lit
(it rotates). God-rays and a sharp reflector are the two things most likely to tank Iris Xe — budget them at
half-res or fake them. The reflector gets *cheaper and classier* the more you blur it.

---

## PART 9 — References (consolidated across all four threads + our local study)

**Docs / API**
- three.js — [Color Management](https://threejs.org/manual/en/color-management.html) · [Tone-Mapping Overview (ACES vs AgX vs Neutral)](https://discourse.threejs.org/t/tone-mapping-overview/75204) · [MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) · [MeshStandardMaterial (lightMap/aoMap/emissiveMap)](https://threejs.org/docs/pages/MeshStandardMaterial.html) · [RectAreaLight](https://threejs.org/docs/#api/en/lights/RectAreaLight) · [KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html) · [DRACOLoader](https://threejs.org/docs/pages/DRACOLoader.html)
- drei — [Environment/Lightformer](https://drei.docs.pmnd.rs/staging/environment) · [ContactShadows / AccumulativeShadows / SoftShadows](https://drei.docs.pmnd.rs) · [MeshReflectorMaterial](https://drei.docs.pmnd.rs/shaders/mesh-reflector-material) · [MeshTransmissionMaterial](https://drei.docs.pmnd.rs/shaders/mesh-transmission-material) · [CubeCamera](https://drei.docs.pmnd.rs/cameras/cube-camera)
- [react-postprocessing](https://react-postprocessing.docs.pmnd.rs) — Bloom · GodRays · LUT (LUTCubeLoader) · ToneMapping · Vignette · Noise · SMAA

**Tutorials / how-to**
- [Bruno Simon — Three.js Journey](https://threejs-journey.com) (baking, environment/staging, post) — the baked-lighting benchmark
- Codrops — [Scroll-driven circular 3D carousel (Dec 2025)](https://tympanus.net/codrops/2025/12/14/the-mechanics-behind-a-scroll-driven-circular-3d-carousel-with-three-js-and-post-processing/) · [Glass torus / MeshTransmissionMaterial (2025)](https://tympanus.net/codrops/2025/03/13/warping-3d-text-inside-a-glass-torus/) · [Transparent glass & plastic (2021)](https://tympanus.net/codrops/2021/10/27/creating-the-effect-of-transparent-glass-and-plastic-in-three-js/) · [Mirrors in R3F (2020)](https://tympanus.net/codrops/2020/09/30/creating-mirrors-in-react-three-fiber-and-three-js/) · [Lusion craft profile (2026)](https://tympanus.net/codrops/2026/04/13/lusion-where-digital-craft-meets-ambitious-experimentation/)
- Baking — [tchayen: Baked lighting in R3F](https://tchayen.github.io/posts/baked-lighting-in-r3f) · [PixelCapture: Lightmap baking in Blender for Three.js](https://pixel-capture.com/tutorials/lightmap-baking-in-blender) · [katsbits](https://www.katsbits.com/codex/bake-lightmaps/) · [Blender baking manual](https://docs.blender.org/manual/en/latest/render/cycles/baking.html)
- Pipeline/perf — [gltf-transform](https://gltf-transform.dev/cli) · [Don McCurdy: web texture formats](https://www.donmccurdy.com/2024/02/11/web-texture-formats/) + [colour management](https://www.donmccurdy.com/2020/06/17/color-management-in-threejs/) · [Khronos KTX artist guide](https://github.com/KhronosGroup/3D-Formats-Guidelines/blob/main/KTXArtistGuide.md) · [utsubo — 100 three.js perf tips](https://www.utsubo.com/blog/threejs-best-practices-100-tips) · [three-good-godrays](https://github.com/Ameobea/three-good-godrays) · [Poly Haven — studio HDRIs](https://polyhaven.com/hdris/studio)

**Reference sites (luxury / cinematic 3D — study the craft)**
- [Lusion](https://lusion.co) / [Oryzo](https://oryzo.ai) · [Cartier — Watches & Wonders](https://www.cartier.com/) (Immersive Garden) · [Active Theory](https://activetheory.net) · [Aristide Benoist](https://aristidebenoist.com) · [Utsubo / IVRESS](https://brand.ivress.co.jp) · [Unseen / Hubtown](https://hubtown.co.in) · [Igloo Inc](https://www.igloo.inc) · [Bruno Simon](https://bruno-simon.com) · [Obys](https://obys.agency) · [Lando Norris](https://landonorris.com) · [LV Collectibles](https://www.awwwards.com/sites/louis-vuitton-collectibles) · [D&G Velvet](https://www.awwwards.com/sites/dg-velvet-collection-experience) · Discovery: [Awwwards Three.js](https://www.awwwards.com/websites/three-js/) · [utsubo best three.js 2026](https://www.utsubo.com/blog/best-threejs-websites-2026)

**Our local study (first-party, on disk)**
- `Desktop/AWWWARDS/00-MASTER.md` + per-site deep-dives (Cartier, Oryzo, Lando, Mana)
- awwwards-architect references: `composition-rubric.md` (the 11-axis scorecard + named principles), `recipes.md` (AgX grade, post pipeline, baked camera), `shader-cookbook.md` (tiered glass, mesh↔particle dissolve, tiling normal/rough maps), `art-direction.md`, `post-and-perf-safety.md`
- `memory/reference_blender_headless_gotchas.md` · `reference_local_gpu_headless_verify.md` · `reference_r3f_shadermaterial_uniforms.md`
