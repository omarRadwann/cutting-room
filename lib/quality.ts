"use client";
import { useEffect, useState } from "react";

/**
 * Adaptive 3-tier quality — the weak-laptop lever AND the crisp-on-strong lever, in one system.
 * HIGH is PINNED to its DPR cap (a capable GPU should render at full res; the adaptive ramp otherwise
 * stalls ~12% below cap from transient scroll fps dips → softer than it should be). STANDARD/SAFE keep
 * the adaptive DPR ramp. **dprMin is the FLOOR and stays 1.0 on every tier** — never go sub-native
 * (CSS-upscale blur is the "looks bad on a weak laptop" symptom). Degrade by shedding post-FX / particles
 * / dropping a whole tier, never by going below 1.0.  (see references/production-hardening.md §B)
 */
export type Tier = "high" | "standard" | "safe";

export type Quality = {
  tier: Tier;
  dprMax: number;
  dprMin: number; // FLOOR — keep 1.0
  ao: boolean;
  dof: boolean;
  bloom: boolean;
  ca: boolean;
  grain: boolean;
  bloomIntensity: number;
  particleScale: number;
  envSize: number;
};

const PRESETS: Record<Tier, Quality> = {
  high:     { tier: "high",     dprMax: 2.0,  dprMin: 1.0, ao: true,  dof: true,  bloom: true,  ca: true,  grain: true,  bloomIntensity: 0.4, particleScale: 1.0,  envSize: 256 },
  standard: { tier: "standard", dprMax: 1.05, dprMin: 1.0, ao: false, dof: false, bloom: true,  ca: false, grain: false, bloomIntensity: 0.3, particleScale: 0.6,  envSize: 128 },
  safe:     { tier: "safe",     dprMax: 1.25, dprMin: 1.0, ao: false, dof: false, bloom: false, ca: false, grain: false, bloomIntensity: 0.0, particleScale: 0.35, envSize: 64  },
};

let current: Tier = "standard";
let forced = false;
let inited = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

function detect(): Tier {
  if (typeof window === "undefined") return "standard";
  try {
    const u = new URLSearchParams(window.location.search);
    const q = (u.get("tier") || u.get("q") || "").toLowerCase();
    if (q === "high" || q === "standard" || q === "safe") { forced = true; return q as Tier; }
    if (q === "low") { forced = true; return "safe"; }
    const ls = localStorage.getItem("aa-tier");
    if (ls === "high" || ls === "standard" || ls === "safe") { forced = true; return ls; }
  } catch { /* ignore */ }
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return "safe";
  if (window.matchMedia?.("(pointer: coarse)").matches) return "safe";
  if (Math.min(window.innerWidth, window.innerHeight) < 560) return "safe";
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    const ext = gl?.getExtension("WEBGL_debug_renderer_info");
    const r = (ext && gl ? String(gl.getParameter((ext as { UNMASKED_RENDERER_WEBGL: number }).UNMASKED_RENDERER_WEBGL)) : "").toLowerCase();
    if (r) {
      if (/(rtx|radeon rx|geforce|apple m[1-9]|arc a)/.test(r)) return "high";
      if (/(swiftshader|software|llvmpipe|microsoft basic)/.test(r)) return "safe";
      if (/(intel|iris|uhd|hd graphics|mali|adreno|powervr)/.test(r)) return "standard";
    }
  } catch { /* ignore */ }
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
  if (cores >= 8 && mem >= 8) return "high";
  if (cores <= 4 || mem <= 4) return "safe";
  return "standard";
}

function ensure() { if (!inited && typeof window !== "undefined") { inited = true; current = detect(); } }

export function getTier(): Tier { ensure(); return current; }
export function getQuality(): Quality { return PRESETS[getTier()]; }
export function tierForced(): boolean { ensure(); return forced; }       // forced tiers are never auto-demoted
export function setTier(t: Tier) { ensure(); current = t; emit(); }       // no persist (used by the boot auto-sampler)
let demoteLock = false; // one demote per ~1.5s — a transient scroll-beat FPS dip must NOT cascade HIGH→STANDARD→SAFE
export function demoteTier() {
  if (demoteLock) return;
  const o: Tier[] = ["high", "standard", "safe"]; const i = o.indexOf(getTier());
  if (i < o.length - 1) { current = o[i + 1]; emit(); demoteLock = true; if (typeof window !== "undefined") setTimeout(() => { demoteLock = false; }, 1500); }
}
export function cycleTier() { const o: Tier[] = ["high", "standard", "safe"]; current = o[(o.indexOf(getTier()) + 1) % 3]; forced = true; try { localStorage.setItem("aa-tier", current); } catch { /* ignore */ } emit(); }
export function subscribeTier(f: () => void) { subs.add(f); return () => { subs.delete(f); }; }

/** Big monitors push ~2× the fragments of the 1360px test rig (the additive shaft/haze stack scales
 *  with pixels). On STANDARD, shed overdraw (a shaft, a third of the dust) past ~1.75MP of CSS viewport.
 *  HIGH keeps the full rig — a capable GPU should render the whole set. */
export function wideShed(): boolean {
  if (typeof window === "undefined") return false;
  return getTier() === "standard" && window.innerWidth * window.innerHeight > 1_750_000;
}

export function useQuality(): Quality {
  const [q, setQ] = useState<Quality>(() => PRESETS[typeof window === "undefined" ? "standard" : getTier()]);
  useEffect(() => { setQ(getQuality()); return subscribeTier(() => setQ(getQuality())); }, []);
  return q;
}
