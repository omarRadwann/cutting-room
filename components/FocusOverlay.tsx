"use client";
import { useEffect } from "react";
import { useUI, setFocus } from "@/lib/ui-store";
import { CLIPS } from "@/lib/content";
import { announce } from "@/lib/announce";

const N = CLIPS.length;

export default function FocusOverlay() {
  const ui = useUI();
  const open = ui.focus !== null;
  const clip = open ? CLIPS[ui.focus as number] : null;

  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    if (open) { lenis?.stop(); if (clip) announce(`${clip.title} — ${clip.campaign}`); }
    else lenis?.start();
    const onKey = (e: KeyboardEvent) => {
      if (!open || ui.focus === null) return;
      if (e.key === "Escape") setFocus(null);
      if (e.key === "ArrowRight") setFocus((ui.focus + 1) % N);
      if (e.key === "ArrowLeft") setFocus((ui.focus - 1 + N) % N);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, ui.focus, clip]);

  return (
    <div className="focus" data-open={open ? 1 : 0} aria-hidden={!open}>
      <div className="focus-scrim" />
      <div className="focus-flash" aria-hidden="true" />
      {clip && (
        <>
          <button className="icon-btn focus-close" onClick={() => setFocus(null)} data-clickable>✕ Close</button>
          <div className="focus-cap">
            <div className="focus-eyebrow">{clip.campaign} — {clip.chapter}</div>
            <div className="focus-title">{clip.title}</div>
            <p className="focus-brief">{clip.brief}</p>
            <div className="focus-tools">{clip.tools}{ui.muted ? "  ·  turn sound on ↗" : ""}</div>
          </div>
          <div className="focus-arrows">
            <button onClick={() => setFocus((ui.focus! - 1 + N) % N)} aria-label="Previous work" data-clickable>‹</button>
            <button onClick={() => setFocus((ui.focus! + 1) % N)} aria-label="Next work" data-clickable>›</button>
          </div>
        </>
      )}
    </div>
  );
}
