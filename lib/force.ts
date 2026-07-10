"use client";
// Verify hooks (dev/headless only):
//   ?force=<0..1>  pins scroll progress to a beat so a screenshot can capture a specific moment.
//   ?posters       disables video decode (headless SwiftShader can't decode H.264) → faithful poster frames.
// Also exposes window.__setForce / __setPosters so one page load can shoot many beats.
let _force: number | null = null;
let _posters = false;
let _dprCap: number | null = null;

if (typeof window !== "undefined") {
  const u = new URLSearchParams(window.location.search);
  const f = u.get("force");
  _force = f != null && f !== "" ? Math.max(0, Math.min(1, parseFloat(f))) : null;
  _posters = u.has("posters");
  const d = u.get("dpr");
  _dprCap = d ? parseFloat(d) : null;
  const w = window as unknown as Record<string, unknown>;
  w.__setForce = (v: number | null) => { _force = v; };
  w.__setPosters = (v: boolean) => { _posters = v; };
}

export const getForce = () => _force;
export const postersOnly = () => _posters;
export const dprCap = () => _dprCap;
