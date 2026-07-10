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
const MIN_MS = 4200; // most of a light-sweep of the mark — and buffer time the videos actually use
const CAP_MS = 8000; // never hold the visitor hostage (slow networks: enter anyway, video catches up)

export default function Preloader() {
  const { progress, active, total } = useProgress();
  const { heroReady } = useUI();
  const [minDone, setMinDone] = useState(false);
  const [capped, setCapped] = useState(false);
  const [settled, setSettled] = useState(false);
  const [done, setDone] = useState(false);
  const [timeP, setTimeP] = useState(0);

  const threeDone = !active && (progress >= 100 || (settled && total === 0));
  const finished = capped || (threeDone && heroReady && minDone);

  useEffect(() => {
    const s = setTimeout(() => setSettled(true), 500);
    const a = setTimeout(() => setMinDone(true), MIN_MS);
    const b = setTimeout(() => setCapped(true), CAP_MS);
    // time-based progress floor: the readout GLIDES to 100 across MIN_MS instead of parking at 99
    const t0 = performance.now();
    const iv = setInterval(() => setTimeP(Math.min(100, ((performance.now() - t0) / MIN_MS) * 100)), 90);
    // warm the first THREE films into the HTTP cache behind the curtain (the loader buys real time)
    for (const c of CLIPS.slice(0, 3)) fetch(withBase(c.src)).catch(() => {});
    return () => { clearTimeout(s); clearTimeout(a); clearTimeout(b); clearInterval(iv); };
  }, []);

  useEffect(() => {
    if (!finished) return;
    document.documentElement.dataset.entered = "1"; // releases the paused hero-title rise (globals.css)
    setEntered(true);
    const t = setTimeout(() => setDone(true), 800); // let the fade play
    return () => clearTimeout(t);
  }, [finished]);

  if (done) return null;

  // displayed progress = the SLOWER of asset progress and elapsed time — smooth, honest, and it
  // arrives at 100 exactly as the gates open (no "99%" that then sits there for seconds)
  const disp = finished ? 100 : Math.min(Math.round(Math.min(progress, timeP)), 99);

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
 *  reduced-motion). The v2 render is dark-or-gold only, so `mix-blend-mode: screen` composites it:
 *  black pixels contribute nothing → the plate's rectangle is mathematically invisible against the
 *  loader — only the letters, their reflections and the light live on the page. */
function FlowMark() {
  const reduce = useMemo(() => prefersReducedMotion(), []);
  const plateStyle: React.CSSProperties = {
    width: "min(82vw, 740px)", aspectRatio: "16 / 9", display: "block",
    mixBlendMode: "screen", pointerEvents: "none",
    // screen removes BLACK; this fade removes everything else near the rim (the v2b render keeps
    // ~12% side margins + a word-pinned light pool, so the fade never touches the letters)
    WebkitMaskImage: "radial-gradient(88% 58% at 50% 45%, #000 62%, transparent 90%)",
    maskImage: "radial-gradient(88% 58% at 50% 45%, #000 62%, transparent 90%)",
  };
  if (reduce) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={withBase("/media/flow-mark.webp")} alt="FLOW" style={plateStyle} />;
  }
  return (
    <video muted autoPlay loop playsInline preload="auto" poster={withBase("/media/flow-mark.webp")} style={plateStyle}>
      <source src={withBase("/media/flow-mark.webm")} type="video/webm" />
      <source src={withBase("/media/flow-mark.mp4")} type="video/mp4" />
    </video>
  );
}
