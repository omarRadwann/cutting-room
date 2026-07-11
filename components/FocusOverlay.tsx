"use client";
import { useEffect, useRef, useState } from "react";
import { useUI, setFocus } from "@/lib/ui-store";
import { CLIPS } from "@/lib/content";
import { focusVideo } from "@/lib/focus-video";
import { announce } from "@/lib/announce";

const N = CLIPS.length;
// editorial timecode: MM:SS:FF at 24fps — the projection booth's clock
const fmtTC = (t: number) => {
  const m = Math.floor(t / 60), s = Math.floor(t % 60), f = Math.floor((t % 1) * 24);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
};

export default function FocusOverlay() {
  const ui = useUI();
  const open = ui.focus !== null;
  const clip = open ? CLIPS[ui.focus as number] : null;

  // 160ms projection-booth blink on film-switch INSIDE focus (re-keyed div replays the animation)
  const prevFocus = useRef<number | null>(null);
  const [blink, setBlink] = useState(0);
  useEffect(() => {
    if (open && prevFocus.current !== null && ui.focus !== prevFocus.current) setBlink((b) => b + 1);
    prevFocus.current = ui.focus;
  }, [ui.focus, open]);

  // timecode scrubline — reads the focused film's live playhead (4Hz is plenty for a TC readout)
  const [tc, setTc] = useState({ label: "00:00:00", frac: 0 });
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      const v = focusVideo.el;
      if (v && v.duration > 0) setTc({ label: fmtTC(v.currentTime), frac: v.currentTime / v.duration });
    }, 250);
    return () => clearInterval(id);
  }, [open, ui.focus]);

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
      {blink > 0 && <div key={blink} className="focus-blink" aria-hidden="true" />}
      {clip && (
        <>
          <button className="icon-btn focus-close" onClick={() => setFocus(null)} data-clickable>✕ Close</button>
          <div className="focus-cap" key={ui.focus}>
            <div className="focus-count">{String((ui.focus as number) + 1).padStart(2, "0")} / {N}</div>
            <div className="focus-eyebrow">{clip.campaign} — {clip.chapter}</div>
            <div className="focus-title">{clip.title}</div>
            <p className="focus-brief">{clip.brief}</p>
            <div className="focus-tools">{clip.tools}{ui.muted ? "  ·  turn sound on ↗" : ""}</div>
            <div className="focus-tc mono2" aria-hidden="true">
              <span className="focus-tc-label">TC {tc.label}</span>
              <span className="focus-tc-bar"><i style={{ transform: `scaleX(${tc.frac})` }} /></span>
            </div>
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
