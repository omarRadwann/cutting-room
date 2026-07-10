// deviceTier.ts — PURE GPU/device tier helpers (no React, no store, no side effects).
//
// RELATIONSHIP TO lib/quality.ts (read this before wiring):
//   quality.ts is the SOURCE OF TRUTH for the live tier: it owns the singleton + pub/sub
//   store, the presets, setTier/demoteTier/tierForced, the boot FPS sampler hookup, and the
//   adaptive DPR ramp (driven from the Canvas `dpr` prop + <AdaptiveQuality/>). This file does
//   NOT replace any of that and holds NO state. It is a library of stateless functions that
//   quality.ts (and Scene.tsx's onCreated) can CALL to make sharper decisions than the inline
//   detect() in quality.ts can today. Specifically it adds two things quality.ts is missing:
//     1) a POST-CREATE GPU read (readGpuRenderer) — quality.ts reads the GPU at boot from a
//        throwaway canvas; reading the REAL renderer string from the live Canvas in onCreated
//        is more reliable and lets you demote a mis-detected tier with setTier(tierFromGpu(...)).
//     2) the INTEGRATED-GPU DPR PIN (isIntegratedGpu + clampDpr) — the single biggest weak-laptop
//        win. quality.ts caps DPR per-tier but does NOT special-case iGPUs; an Iris Xe at DPR 1.5
//        is ~2.25x the fill-rate work of DPR 1.0 and turns the scene into a slideshow. Pin
//        integrated GPUs to native 1.0.
//
//   HOW TO WIRE (do by hand — these helpers are inert until called):
//     • In Scene.tsx onCreated: `const r = readGpuRenderer(gl.getContext()); const t = tierFromGpu(r);
//       if (t && !tierForced()) setTier(t);` then `gl.setPixelRatio(clampDpr(getTier(), isIntegratedGpu(r)))`.
//     • Or fold isIntegratedGpu/clampDpr into quality.ts's DPR decision so <AdaptiveQuality/>'s
//       `min/max` already reflect the iGPU pin.
//   Tier strings ("high" | "standard" | "safe") are intentionally identical to quality.ts's Tier
//   so the two interoperate with no adapter. (see references/production-hardening.md §B)

// Mirror of quality.ts's Tier — kept structurally identical so the values are interchangeable.
export type DeviceTier = "high" | "standard" | "safe";

// DPR is clamped to [1.0, cap]. The cap only bites on hi-dpi (retina) screens; a 1.0-dpr laptop
// stays crisp at 1.0 on every tier and the EFFECT cuts (in quality.ts presets) do the work. These
// caps match quality.ts's dprMax per tier so the two systems agree.
export const TIER_DPR_CAP: Record<DeviceTier, number> = {
  high: 2.0,
  standard: 1.5,
  safe: 1.25,
};

/**
 * Resolve the DPR to actually render at. FLOOR is 1.0 on every tier — we never render below native
 * resolution (sub-native CSS upscaling is exactly what makes weak laptops look blurry). Degrade by
 * shedding post-FX / particles / dropping a tier, never by going below 1.0.
 *
 * Pass `integrated = isIntegratedGpu(renderer)`: integrated GPUs are FILL-RATE bound — rendering at
 * 1.5x device pixels is 2.25x the pixel work of 1.0x, and that (not triangles or post-FX) is the
 * single biggest cost on an iGPU. So integrated GPUs are pinned to native 1.0 on every tier;
 * discrete GPUs keep their tier's cap.
 */
export function clampDpr(tier: DeviceTier, integrated = false): number {
  const native = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const cap = integrated ? 1.0 : TIER_DPR_CAP[tier];
  return Math.max(1.0, Math.min(native, cap));
}

/**
 * Conservative boot guess from synchronous signals (no GL context yet). GPU seed = CEILING:
 * we start STANDARD unless something strongly says otherwise — never boot HIGH then crash to SAFE.
 * The GPU read (post-create, via tierFromGpu) and the boot-FPS sample only ever DEMOTE from here.
 * Returns "standard" during SSR.
 *
 * NOTE: quality.ts already runs its own boot detect() that subsumes this and also reads the GPU
 * from a throwaway canvas. Use initialTier() only if you want a lighter, GPU-free synchronous seed
 * (e.g. to feed quality.ts before its first canvas exists) — otherwise prefer quality.ts's getTier().
 */
export function initialTier(): DeviceTier {
  if (typeof window === "undefined") return "standard";
  const mm = (q: string) => window.matchMedia(q).matches;
  if (mm("(prefers-reduced-motion: reduce)")) return "safe";
  // Small phones (coarse pointer + short side) — keep it safe even before the GPU read.
  if (mm("(pointer: coarse)") && Math.min(window.innerWidth, window.innerHeight) <= 480) {
    return "safe";
  }
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  if (cores <= 4 || mem <= 4) return "safe"; // low-end → start safe; the GPU read may lift to standard
  return "standard";
}

/**
 * Read the unmasked GPU renderer string. Needs a LIVE GL context → call from Canvas onCreated with
 * `gl.getContext()` (or pass an existing WebGL context). Returns "" when the debug-renderer extension
 * is blocked (some privacy modes). This is the most reliable GPU signal — more so than quality.ts's
 * boot read off a throwaway canvas, which some drivers answer with a masked/generic string.
 */
export function readGpuRenderer(gl: WebGLRenderingContext | WebGL2RenderingContext): string {
  try {
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return ext ? String(gl.getParameter((ext as { UNMASKED_RENDERER_WEBGL: number }).UNMASKED_RENDERER_WEBGL) || "") : "";
  } catch {
    return "";
  }
}

/**
 * Map a GPU renderer string to a tier. Discrete / Apple-Silicon GPUs → HIGH; capable Intel iGPUs
 * (Iris Xe/Plus, UHD) → STANDARD; older/weaker Intel (HD Graphics), software rasterizers and mobile
 * GPUs → SAFE. Returns null for an unknown string (keep the current/boot tier).
 *
 * This is the single most-diagnostic signal: a "gaming laptop" that looks bad is almost always
 * Chrome running on the Intel iGPU (not the dGPU), which this catches. HARD-LEARNED: do NOT map Iris
 * → high — measured Iris Xe at HIGH (SSAO + bloom + SMAA, DPR 1.5) ≈ 1–2 fps; at STANDARD@DPR1.0 ≈
 * 70 fps. quality.ts's PerformanceMonitor can still step STANDARD→SAFE for a weaker iGPU.
 *
 * (Note: quality.ts's inline regex maps `intel/iris/uhd` → STANDARD as one bucket; this split is
 * stricter — it sends bare "HD Graphics"/"intel" to SAFE. If you wire this in, it will be slightly
 * more conservative than quality.ts's default, which is the safer direction for weak laptops.)
 */
export function tierFromGpu(renderer: string): DeviceTier | null {
  const r = renderer.toLowerCase();
  if (!r) return null;
  // Apple GPUs report a MASKED "Apple GPU" string under WebGL — treat as HIGH (Apple Silicon).
  if (/apple m[1-9]|apple gpu/.test(r)) return "high";
  // Discrete / Apple Silicon → HIGH. (Intel Arc is discrete → matches \barc\b here.)
  if (/(rtx|gtx|geforce|radeon|\barc\b|quadro|nvidia)/.test(r)) return "high";
  // Capable Intel iGPUs (Iris Xe/Plus, UHD) → STANDARD, never HIGH.
  if (/iris|uhd/.test(r)) return "standard";
  // Older/weaker Intel (HD Graphics, pre-UHD) + software / mobile GPUs → SAFE.
  if (/(intel|hd graphics|mali|adreno|powervr|llvmpipe|swiftshader|microsoft basic|softwarerasterizer)/.test(r)) {
    return "safe";
  }
  return null;
}

/**
 * Fill-rate-bound integrated / mobile / software GPUs → DPR pinned to 1.0 (feed this to clampDpr).
 * Discrete GPUs (NVIDIA / Radeon / Apple Silicon / Intel Arc) return false and keep their tier's DPR
 * cap. Call with the unmasked renderer string from readGpuRenderer().
 */
export function isIntegratedGpu(renderer: string): boolean {
  const r = renderer.toLowerCase();
  if (!r) return false;
  if (/\barc\b/.test(r)) return false; // Intel Arc is discrete
  if (/apple m[1-9]|apple gpu/.test(r)) return false; // Apple Silicon is a fast unified-memory GPU
  if (/(rtx|gtx|geforce|radeon|quadro|nvidia)/.test(r)) return false; // discrete
  return /iris|uhd|hd graphics|intel|mali|adreno|powervr|llvmpipe|swiftshader|microsoft basic|softwarerasterizer/.test(r);
}

/**
 * Resolve a ?tier= override (SSR-safe). Pins the tier so the GPU read / PerformanceMonitor can't
 * move it — for measuring a specific tier on a real device AND for the headless-Playwright capture
 * recipe (where the GL string reports SwiftShader and would otherwise force SAFE). Mirrors the
 * ?tier= handling quality.ts already does; use whichever you wire first, don't apply both.
 */
export function readForcedTier(): DeviceTier | null {
  if (typeof window === "undefined") return null;
  const t = (new URLSearchParams(window.location.search).get("tier") || "").toLowerCase();
  if (t === "high" || t === "standard" || t === "safe") return t;
  if (t === "low") return "safe";
  return null;
}
