"use client";

import { useEffect, useState } from "react";
import { cycleTier, getTier } from "@/lib/quality";

/** Dev/QA quality cycle (HIGH → STANDARD → SAFE). Cycling persists + remounts the Canvas (key={tier}).
 *  Gated behind ?debug=1 (like DebugOverlay) so the badge never shows in the real experience — QA appends
 *  ?debug=1 to cycle tiers; ship builds stay clean automatically. */
export default function QualityToggle() {
  const [show, setShow] = useState(false);
  const [label, setLabel] = useState("STANDARD");
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("debug")) return;
    setShow(true); setLabel(getTier().toUpperCase());
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => { cycleTier(); setLabel(getTier().toUpperCase()); }}
      aria-label="Cycle render quality"
      data-cursor
      style={{
        position: "fixed", top: 12, right: 12, zIndex: 9999,
        font: "11px/1 ui-monospace, monospace", letterSpacing: "0.12em", color: "#d7eef6",
        background: "rgba(2,10,18,0.6)", border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 100, padding: "7px 13px", cursor: "pointer", backdropFilter: "blur(6px)",
      }}
    >
      ● {label}
    </button>
  );
}
