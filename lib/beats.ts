/**
 * beats.ts — canonical-vs-physical scroll space + the named-beat vocabulary.
 *
 * THE PROBLEM IT SOLVES
 *   You author every camera key, shader window and reveal against a CANONICAL scroll space where
 *   section i's top sits at i/N (the natural space when all sections are equal height). But the moment
 *   you WEIGHT sections (give the climax 3x the scroll room, the intro 0.5x), physical Lenis progress
 *   (lib/scroll-store.ts `scroll.progress`, 0..1 of real scrollable height) no longer lines up with
 *   those numbers — the climax fires too early, the intro drags. Re-authoring every magic number per
 *   layout tweak is misery.
 *
 *   beats.ts decouples the two: `calibrate()` measures the REAL section tops once after layout, and
 *   `toCanonical()` piecewise-linearly remaps physical → canonical. Feed canonical p to all consumers
 *   and they stay correct no matter how you weight the sections. `toPhysical()` is the inverse, for
 *   programmatic scrollTo (nav dots, "skip to" links).
 *
 * HOW IT PLUGS INTO THE SCAFFOLD (wire by hand — see header of each fn):
 *   In SmoothScroll.tsx's `lenis.on("scroll", ...)` you currently do `scroll.progress = e.progress`.
 *   Change it to `scroll.progress = toCanonical(e.progress ?? 0)` so EVERY consumer (ScrollCameraRig,
 *   shaders, this file's bell()) reads canonical p with zero further changes. Call `calibrate()` once
 *   after mount/layout and on resize (e.g. in a useEffect with a ResizeObserver, or after fonts load).
 *   For nav dots that jump to a beat: `window.__lenis?.scrollTo(toPhysical(BEATS.FINALE[0]) * maxScroll)`.
 *
 *   This module is framework-LIGHT on purpose: pure functions + one tiny module-level knot table.
 *   No React, no imports — it composes with scroll-store.ts rather than replacing it.
 *
 * DOCTRINE: new code must use the named windows + beatProgress()/bell() below — never fresh magic
 * numbers sprinkled across components. One table, one vocabulary.
 *
 * (Adapted from the hadia-ghaleb "DOCTRINE" beats system — generalized: configurable section count,
 *  generic beat names, and a calibrate() that finds sections without a hard-coded "#main > section".)
 */

export type BeatWindow = readonly [number, number];

/**
 * The named beats, in CANONICAL space (0..1). These are placeholders — REPLACE the names and ranges
 * with your story's actual moments (each [start, end] is a canonical-progress window). Keep them
 * ordered and roughly contiguous; overlaps are fine (cross-dissolves). Example shape below.
 */
export const BEATS = {
  INTRO: [0.0, 0.12],
  REVEAL: [0.12, 0.3],
  DESCENT: [0.3, 0.5],
  DWELL: [0.48, 0.6],
  EXPAND: [0.58, 0.78],
  FINALE: [0.78, 0.94],
  OUTRO: [0.92, 1.0],
} as const satisfies Record<string, BeatWindow>;

export type BeatName = keyof typeof BEATS;

// ---- shaping helpers (pure) -----------------------------------------------------------------------

const sstep = (p: number, a: number, b: number): number => {
  const t = Math.min(1, Math.max(0, (p - a) / Math.max(1e-6, b - a)));
  return t * t * (3 - 2 * t); // smoothstep
};

/** 0→1 across the window (clamped). The raw "how far through this beat am I" value. */
export function across(p: number, w: BeatWindow): number {
  return Math.min(1, Math.max(0, (p - w[0]) / Math.max(1e-6, w[1] - w[0])));
}

/**
 * Bell: ~1 inside the window, smooth shoulders easing in/out over easeIn/easeOut canonical units.
 * Use for "intensity of this beat right now" — opacity of a layer, weight of a camera offset, a
 * post-FX amount that should swell and fade as the beat enters and leaves view.
 */
export function bell(p: number, w: BeatWindow, easeIn = 0.04, easeOut = 0.04): number {
  return Math.min(1, Math.max(0, sstep(p, w[0] - easeIn, w[0]) - sstep(p, w[1], w[1] + easeOut)));
}

/**
 * Convenience: progress 0→1 across a NAMED beat at canonical p (clamped). Sugar over across(p, BEATS[name]).
 * `beatProgress("DESCENT", scroll.progress)` → 0 before the descent, 1 once it's complete.
 */
export function beatProgress(name: BeatName, p: number): number {
  return across(p, BEATS[name]);
}

/** Convenience: bell intensity of a NAMED beat at canonical p. Sugar over bell(p, BEATS[name]). */
export function beatBell(name: BeatName, p: number, easeIn = 0.04, easeOut = 0.04): number {
  return bell(p, BEATS[name], easeIn, easeOut);
}

/** Is canonical p inside (or within the eased shoulders of) a named beat? Cheap gate for activating
 *  expensive per-beat systems (start a particle sim only while its beat is on screen). */
export function inBeat(name: BeatName, p: number, pad = 0.04): boolean {
  const w = BEATS[name];
  return p >= w[0] - pad && p <= w[1] + pad;
}

// ---- physical → canonical calibration (tiny module store) ----------------------------------------

type Knot = { phys: number; canon: number };
let knots: Knot[] | null = null;

/**
 * Measure the real section tops (post-layout) → physical knots; canonical knots are fixed at i/(N-1).
 * Call once after layout settles and again on resize. Pass a CSS selector for your section elements
 * (default "[data-beat-section]" — add that attribute to each scroll section, or pass e.g.
 * "#main > section"). Safe to call repeatedly; it no-ops on a collapsed/not-yet-laid-out DOM so a
 * mid-load measurement can't poison the map (identity passthrough stays in effect until a good read).
 */
export function calibrate(selector = "[data-beat-section]"): void {
  if (typeof window === "undefined") return;
  const sections = Array.from(document.querySelectorAll<HTMLElement>(selector));
  if (sections.length < 2) return;
  const total = document.documentElement.scrollHeight - window.innerHeight;
  if (total <= 0) return;
  const n = sections.length - 1;
  const ks: Knot[] = sections.map((s, i) => ({
    phys: Math.min(1, Math.max(0, (s.getBoundingClientRect().top + window.scrollY) / total)),
    canon: i / n,
  }));
  // MONOTONIC GUARD: a collapsed layout mid-load can report equal/decreasing tops, which would make
  // the map non-invertible (and toPhysical ambiguous). Bail and keep the previous (or identity) map.
  for (let i = 1; i < ks.length; i++) if (ks[i].phys <= ks[i - 1].phys) return;
  // The last section's top is usually < 1 physical (it doesn't start at the very bottom); pin a
  // (1,1) knot so the tail of the scroll maps cleanly to canonical 1.
  if (ks[ks.length - 1].canon === 1 && ks[ks.length - 1].phys < 1) ks.push({ phys: 1, canon: 1 });
  knots = ks;
}

/** Has a successful calibrate() run? (Until then, toCanonical/toPhysical are identity passthroughs.) */
export function isCalibrated(): boolean {
  return knots !== null;
}

/** Drop calibration (e.g. before re-measuring on a layout teardown). Reverts to identity passthrough. */
export function resetCalibration(): void {
  knots = null;
}

/** Piecewise-linear physical → canonical. IDENTITY until the first successful calibrate(). */
export function toCanonical(p: number): number {
  const ks = knots;
  if (!ks) return p;
  if (p <= ks[0].phys) return ks[0].canon;
  for (let i = 0; i < ks.length - 1; i++) {
    if (p <= ks[i + 1].phys) {
      const t = (p - ks[i].phys) / Math.max(1e-6, ks[i + 1].phys - ks[i].phys);
      return ks[i].canon + t * (ks[i + 1].canon - ks[i].canon);
    }
  }
  return 1;
}

/** Canonical → physical (inverse of toCanonical) — for programmatic scrollTo (nav dots, deep links).
 *  IDENTITY until the first successful calibrate(). Multiply the result by the max scroll distance. */
export function toPhysical(c: number): number {
  const ks = knots;
  if (!ks) return c;
  if (c <= ks[0].canon) return ks[0].phys;
  for (let i = 0; i < ks.length - 1; i++) {
    if (c <= ks[i + 1].canon) {
      const t = (c - ks[i].canon) / Math.max(1e-6, ks[i + 1].canon - ks[i].canon);
      return ks[i].phys + t * (ks[i + 1].phys - ks[i].phys);
    }
  }
  return 1;
}
