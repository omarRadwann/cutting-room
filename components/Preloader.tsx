"use client";

import { useProgress } from "@react-three/drei";
import { useEffect, useState } from "react";

/**
 * Branded, REAL-progress preloader — an Academy film-leader countdown (this is The Cutting Room:
 * the site boots like a reel). useProgress reads three's default loading manager, so the sweep +
 * numeral reflect actual asset/decoding progress; the countdown maps 0–100% onto 8 → 1.
 *
 * Robust for PROCEDURAL scenes: if nothing async ever loads (total === 0), it dismisses shortly
 * after mount instead of hanging at 0% forever.
 */
export default function Preloader() {
  const { progress, active, total } = useProgress();
  const [settled, setSettled] = useState(false);
  const [done, setDone] = useState(false);
  const finished = !active && (progress >= 100 || (settled && total === 0));

  useEffect(() => { const t = setTimeout(() => setSettled(true), 500); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (finished) {
      const t = setTimeout(() => setDone(true), 650); // let the fade play
      return () => clearTimeout(t);
    }
  }, [finished]);

  if (done) return null;

  const R = 66, C = 2 * Math.PI * R;
  const sweep = (Math.max(0, Math.min(100, progress)) / 100) * C;
  const count = Math.max(1, 8 - Math.floor(progress / 12.5)); // 8 → 1 as the reel loads

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed", inset: 0, zIndex: 50, background: "var(--base)",
        display: "grid", placeItems: "center",
        opacity: finished ? 0 : 1, transition: "opacity 0.65s var(--ease-out)", pointerEvents: "none",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.6rem" }}>
        {/* the leader: crosshair + ring + a real-progress sweep, numeral counting 8 → 1 */}
        <div style={{ position: "relative", width: 168, height: 168, display: "grid", placeItems: "center" }}>
          <svg width="168" height="168" viewBox="0 0 168 168" style={{ position: "absolute", inset: 0 }}>
            <line x1="84" y1="4" x2="84" y2="164" stroke="var(--line)" strokeWidth="1" />
            <line x1="4" y1="84" x2="164" y2="84" stroke="var(--line)" strokeWidth="1" />
            <circle cx="84" cy="84" r={R} fill="none" stroke="var(--line)" strokeWidth="1" />
            <circle cx="84" cy="84" r={R - 7} fill="none" stroke="var(--line)" strokeWidth="0.5" opacity="0.6" />
            <circle
              cx="84" cy="84" r={R} fill="none" stroke="var(--accent)" strokeWidth="1.5"
              strokeDasharray={`${sweep} ${C}`} strokeLinecap="round"
              transform="rotate(-90 84 84)" style={{ transition: "stroke-dasharray 0.25s linear" }}
            />
          </svg>
          <div
            style={{
              fontFamily: "var(--font-display)", fontVariationSettings: '"opsz" 144',
              fontSize: "4.6rem", lineHeight: 1, color: "var(--text)",
              textShadow: "0 2px 30px rgba(4,4,7,0.6)", background: "var(--base)",
              padding: "0 0.18em", // sits over the crosshair like a printed leader numeral
            }}
          >
            {count}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.45rem" }}>
          <div style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.22em", fontSize: "0.78rem", color: "var(--text)" }}>
            The Cutting Room
          </div>
          <div dir="rtl" style={{ fontFamily: "var(--font-ar)", color: "var(--muted)", fontSize: "0.8rem" }}>
            غرفة المونتاج
          </div>
        </div>
      </div>
    </div>
  );
}
