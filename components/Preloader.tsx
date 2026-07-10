"use client";

import { useProgress } from "@react-three/drei";
import { useEffect, useState } from "react";
import { useUI, setEntered } from "@/lib/ui-store";
import { CLIPS } from "@/lib/content";
import { withBase } from "@/lib/withBase";

/**
 * Academy film-leader preloader — the site boots like a reel. It now waits for the WHOLE opening to be
 * genuinely ready: three's asset manager (posters/textures) AND the hero <video> buffered to play through,
 * with a MINIMUM dwell (the countdown gets to breathe) and a hard cap (it can never hang). While it holds,
 * the first drum film is warmed into the HTTP cache, so the first scroll is instant.
 */
const MIN_MS = 2600; // let the leader count — and give the scene time to compile shaders behind the curtain
const CAP_MS = 7000; // never hold the visitor hostage (slow networks: enter anyway, video catches up)

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
    fetch(withBase(CLIPS[0].src)).catch(() => {}); // warm the first film into cache behind the curtain
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
  const R = 66, C = 2 * Math.PI * R;
  const sweep = (disp / 100) * C;
  const count = Math.max(1, 8 - Math.floor(disp / 12.5)); // the leader counts 8 → 1

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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.7rem" }}>
        {/* the leader: crosshair + rings + real-progress sweep + a rotating arm, numeral 8 → 1 */}
        <div style={{ position: "relative", width: 176, height: 176, display: "grid", placeItems: "center" }}>
          <svg width="176" height="176" viewBox="0 0 176 176" style={{ position: "absolute", inset: 0 }}>
            <line x1="88" y1="4" x2="88" y2="172" stroke="var(--line)" strokeWidth="1" />
            <line x1="4" y1="88" x2="172" y2="88" stroke="var(--line)" strokeWidth="1" />
            <circle cx="88" cy="88" r={R} fill="none" stroke="var(--line)" strokeWidth="1" />
            <circle cx="88" cy="88" r={R - 8} fill="none" stroke="var(--line)" strokeWidth="0.5" opacity="0.55" />
            {/* the sweeping leader arm */}
            <line
              x1="88" y1="88" x2="88" y2={88 - R + 2}
              stroke="rgba(216,162,74,0.5)" strokeWidth="1"
              transform={`rotate(${disp * 3.6} 88 88)`}
              style={{ transition: "transform 0.3s linear" }}
            />
            {/* real-progress arc */}
            <circle
              cx="88" cy="88" r={R} fill="none" stroke="var(--accent)" strokeWidth="1.5"
              strokeDasharray={`${sweep} ${C}`} strokeLinecap="round"
              transform="rotate(-90 88 88)" style={{ transition: "stroke-dasharray 0.3s linear" }}
            />
          </svg>
          <div
            style={{
              fontFamily: "var(--font-display)", fontVariationSettings: '"opsz" 144',
              fontSize: "4.8rem", lineHeight: 1, color: "var(--text)",
              background: "var(--base)", padding: "0 0.18em",
            }}
          >
            {count}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.24em", fontSize: "0.8rem", color: "var(--text)" }}>
            The Cutting Room
          </div>
          <div dir="rtl" style={{ fontFamily: "var(--font-ar)", color: "var(--muted)", fontSize: "0.8rem" }}>
            غرفة المونتاج
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.28em", color: "var(--muted)", marginTop: "0.5rem" }}>
            LOADING REEL · {String(disp).padStart(2, "0")}%
          </div>
        </div>
      </div>
    </div>
  );
}
