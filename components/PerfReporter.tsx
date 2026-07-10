"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { perf } from "@/lib/perf-store";
import { getTier, demoteTier, setTier, tierForced } from "@/lib/quality";

let booted = false; // module scope: the boot FPS correction runs ONCE (survives tier remounts)

/**
 * Canvas-side telemetry → perf store, read by <DebugOverlay/>. Two non-obvious correctness fixes:
 *  - gl.info.autoReset=false + manual reset(): under an EffectComposer the renderer issues several
 *    render() calls/frame; with autoReset on, gl.info reflects only the final fullscreen pass (1 draw,
 *    0 tris). Reset once ourselves (this useFrame runs before the composer's) for honest totals.
 *  - true DPR from the backbuffer: getPixelRatio() reads stale once the composer manages render targets.
 * Also runs a ~4.5s boot FPS sampler that demotes a mis-detected tier (sample late so the load-time dip
 * doesn't wrongly demote a strong GPU). (references/production-hardening.md §A/§E)
 */
export default function PerfReporter() {
  const gl = useThree((s) => s.gl);
  const w1 = useRef<number[]>([]);
  const w10 = useRef<number[]>([]);

  useEffect(() => {
    try {
      const ctx = gl.getContext();
      const ext = ctx.getExtension("WEBGL_debug_renderer_info");
      perf.gpu = ext ? String(ctx.getParameter((ext as { UNMASKED_RENDERER_WEBGL: number }).UNMASKED_RENDERER_WEBGL)) : "?";
      perf.webgl2 = typeof WebGL2RenderingContext !== "undefined" && ctx instanceof WebGL2RenderingContext;
      gl.info.autoReset = false;
    } catch { /* ignore */ }
    const t = setTimeout(() => {
      if (!booted && !tierForced()) {
        booted = true;
        const f = perf.fps1;
        if (f > 0 && f < 32) setTier("safe");
        else if (f > 0 && getTier() === "high" && f < 46) demoteTier();
        else if (f > 0 && getTier() === "standard" && f < 36) demoteTier();
      }
    }, 4500);
    return () => clearTimeout(t);
  }, [gl]);

  useFrame((_, dt) => {
    const d = Math.min(0.1, dt) || 0.016;
    const a = w1.current; a.push(d); let s = 0;
    for (let i = a.length - 1; i >= 0; i--) { s += a[i]; if (s > 1) { a.splice(0, i); break; } }
    perf.fps1 = a.length / Math.max(0.001, a.reduce((x, y) => x + y, 0));
    const b = w10.current; b.push(d); let s2 = 0;
    for (let i = b.length - 1; i >= 0; i--) { s2 += b[i]; if (s2 > 10) { b.splice(0, i); break; } }
    perf.fps10 = b.length / Math.max(0.001, b.reduce((x, y) => x + y, 0));
    const el = gl.domElement;
    perf.dpr = el.clientWidth ? el.width / el.clientWidth : gl.getPixelRatio();
    perf.drawCalls = gl.info.render.calls;
    perf.triangles = gl.info.render.triangles;
    perf.geometries = gl.info.memory.geometries;
    perf.textures = gl.info.memory.textures;
    perf.programs = gl.info.programs?.length ?? 0;
    gl.info.reset(); // clear for the upcoming frame's accumulation (runs before the composer's useFrame)
  });

  return null;
}
