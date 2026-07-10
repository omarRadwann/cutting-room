"use client";

import { useProgress } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import { useUI, setEntered } from "@/lib/ui-store";
import { CLIPS } from "@/lib/content";
import { withBase } from "@/lib/withBase";
import { prefersReducedMotion } from "@/lib/reduced-motion";

/**
 * The FLOW mark preloader — the studio's 3D wordmark, modeled/lit/RENDERED in Blender (gold metal
 * letters, a light sweeping through the word, seamless loop) playing as a zero-GPU-cost video while
 * the real work happens behind the curtain: shaders compile, the hero buffers to canplaythrough, and
 * the first three films warm the HTTP cache. Real progress readout; a hard cap so it never hangs.
 */
const MIN_MS = 3400; // one full sweep of the mark — and buffer time the videos actually use
const CAP_MS = 8000; // never hold the visitor hostage (slow networks: enter anyway, video catches up)

export default function Preloader() {
  const { progress, active, total } = useProgress();
  const { heroReady } = useUI();
  const [minDone, setMinDone] = useState(false);
  const [capped, setCapped] = useState(false);
  const [settled, setSettled] = useState(false);
  const [done, setDone] = useState(false);

  const threeDone = !active && (progress >= 100 || (settled && total === 0));
  const finished = capped || (threeDone && heroReady && minDone);

  useEffect(() => {
    const s = setTimeout(() => setSettled(true), 500);
    const a = setTimeout(() => setMinDone(true), MIN_MS);
    const b = setTimeout(() => setCapped(true), CAP_MS);
    // warm the first THREE films into the HTTP cache behind the curtain (the loader buys real time)
    for (const c of CLIPS.slice(0, 3)) fetch(withBase(c.src)).catch(() => {});
    return () => { clearTimeout(s); clearTimeout(a); clearTimeout(b); };
  }, []);

  useEffect(() => {
    if (!finished) return;
    document.documentElement.dataset.entered = "1"; // releases the paused hero-title rise (globals.css)
    setEntered(true);
    const t = setTimeout(() => setDone(true), 800); // let the fade play
    return () => clearTimeout(t);
  }, [finished]);

  if (done) return null;

  // displayed progress holds at 99 until every gate opens — no "100%" that then sits there
  const disp = finished ? 100 : Math.min(Math.round(progress), 99);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed", inset: 0, zIndex: 50, background: "var(--base)",
        display: "grid", placeItems: "center",
        opacity: finished ? 0 : 1,
        transform: finished ? "scale(1.045)" : "scale(1)",
        transition: "opacity 0.8s var(--ease-out), transform 0.8s var(--ease-out)",
        pointerEvents: "none",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
        {/* the FLOW mark — 3D letters modeled, lit and rendered in Blender; a light sweeps through the
            word on a seamless loop. Edges masked so the plate melts into the room. */}
        <FlowMark />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.55rem" }}>
          <div style={{ fontFamily: "var(--font-body)", textTransform: "uppercase", letterSpacing: "0.3em", fontSize: "0.62rem", color: "var(--muted)" }}>
            A film &amp; motion studio
          </div>
          <div style={{ position: "relative", width: 168, height: 2, background: "rgba(242,237,227,0.14)", overflow: "hidden" }}>
            <i style={{ position: "absolute", inset: 0, background: "var(--accent)", transformOrigin: "left", transform: `scaleX(${disp / 100})`, transition: "transform 0.3s linear", display: "block" }} />
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.28em", color: "var(--muted)" }}>
            LOADING REEL · {String(disp).padStart(2, "0")}%
          </div>
        </div>
      </div>
    </div>
  );
}

/** The Blender-rendered wordmark plate (webm first — smaller; mp4 fallback; still frame under
 *  reduced-motion). pointer-events none; radial mask blends the plate into the loader's black. */
function FlowMark() {
  const reduce = useMemo(() => prefersReducedMotion(), []);
  const maskStyle: React.CSSProperties = {
    width: "min(58vw, 480px)", aspectRatio: "16 / 9", display: "block",
    WebkitMaskImage: "radial-gradient(88% 82% at 50% 50%, #000 58%, transparent 98%)",
    maskImage: "radial-gradient(88% 82% at 50% 50%, #000 58%, transparent 98%)",
  };
  if (reduce) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={withBase("/media/flow-mark.webp")} alt="FLOW" style={maskStyle} />;
  }
  return (
    <video muted autoPlay loop playsInline preload="auto" poster={withBase("/media/flow-mark.webp")} style={maskStyle}>
      <source src={withBase("/media/flow-mark.webm")} type="video/webm" />
      <source src={withBase("/media/flow-mark.mp4")} type="video/mp4" />
    </video>
  );
}
