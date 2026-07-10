import * as THREE from "three";

// Film-gate slat cookie — five soft gate bars. Once projected by a SpotLight; now the texture of the
// zero-cost additive slat plane that rides the tracking StageLight (the profile-gated fallback).
let _goboTex: THREE.CanvasTexture | null = null;
export function goboTex(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  if (_goboTex) return _goboTex;
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const ctx = c.getContext("2d")!;
  // transparent bg; bars only (the plane is additive)
  for (let i = 0; i < 5; i++) {
    const x = 40 + i * 96, w = 58;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, "rgba(255,226,184,0)"); g.addColorStop(0.28, "rgba(255,226,184,0.9)");
    g.addColorStop(0.72, "rgba(255,226,184,0.9)"); g.addColorStop(1, "rgba(255,226,184,0)");
    ctx.fillStyle = g; ctx.fillRect(x, 0, w, 512);
  }
  // fade the slats out along their length so they dissolve toward the drum
  const fade = ctx.createLinearGradient(0, 0, 0, 512);
  fade.addColorStop(0, "rgba(0,0,0,1)"); fade.addColorStop(0.55, "rgba(0,0,0,0.25)"); fade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = fade; ctx.fillRect(0, 0, 512, 512);
  ctx.globalCompositeOperation = "source-over";
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  _goboTex = t; return t;
}
