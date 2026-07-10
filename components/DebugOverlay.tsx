"use client";

import { useEffect, useState } from "react";
import { perf } from "@/lib/perf-store";
import { getQuality, getTier } from "@/lib/quality";

/** QA/perf overlay. Off by default; on with ?debug=1 or Shift+D. Pure DOM, polls the perf store each frame.
 *  This is the single honest source for the numbers you tune against — mount it from Phase 3, not when stuck. */
export default function DebugOverlay() {
  const [on, setOn] = useState(false);
  const [, force] = useState(0);

  useEffect(() => {
    try { if (new URLSearchParams(window.location.search).get("debug") === "1") setOn(true); } catch { /* ignore */ }
    const onKey = (e: KeyboardEvent) => { if (e.shiftKey && (e.key === "D" || e.key === "d")) setOn((v) => !v); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!on) return;
    let raf = 0;
    const tick = () => { force((x) => (x + 1) % 1e6); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on]);

  if (!on) return null;
  const q = getQuality();
  const fpsCol = perf.fps1 >= 55 ? "#7CFFA0" : perf.fps1 >= 40 ? "#ffd271" : "#ff6a6a";
  const Row = ({ k, v, col }: { k: string; v: string; col?: string }) => (
    <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
      <span style={{ opacity: 0.55 }}>{k}</span>
      <span style={{ color: col }}>{v}</span>
    </div>
  );
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed", top: 10, left: 10, zIndex: 9999, pointerEvents: "none",
        font: "11px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace", color: "#d7eef6",
        background: "rgba(2,10,18,0.74)", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 8, padding: "8px 11px", minWidth: 222, backdropFilter: "blur(4px)",
      }}
    >
      <Row k="TIER" v={getTier().toUpperCase()} />
      <Row k="DPR" v={`${perf.dpr.toFixed(2)}  (cap ${q.dprMax}, floor ${q.dprMin})`} />
      <Row k="FPS 1s/10s" v={`${Math.round(perf.fps1)} / ${Math.round(perf.fps10)}`} col={fpsCol} />
      <Row k="DRAW CALLS" v={`${perf.drawCalls}`} />
      <Row k="TRIANGLES" v={`${(perf.triangles / 1e6).toFixed(2)}M`} />
      <Row k="GEO/TEX/PROG" v={`${perf.geometries} / ${perf.textures} / ${perf.programs}`} />
      <Row k="WEBGL2" v={perf.webgl2 ? "yes" : "no"} />
      <Row k="GPU" v={perf.gpu.length > 42 ? perf.gpu.slice(0, 42) + "…" : perf.gpu} />
    </div>
  );
}
