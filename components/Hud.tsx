"use client";
import { useUI } from "@/lib/ui-store";
import { CLIPS, CHAPTERS } from "@/lib/content";

const pad = (n: number) => String(n + 1).padStart(2, "0");

export default function Hud() {
  const ui = useUI();
  const idx = ui.focus ?? ui.front;
  const clip = CLIPS[idx];
  const c = CHAPTERS.find((x) => x.key === clip?.chapter);
  return (
    <div className="hud" aria-hidden="true">
      <div className="count"><span className="hud-n" key={idx}>{pad(idx)}</span><span className="sep"> / {pad(CLIPS.length - 1)}</span></div>
      <div className="chap">
        <span className="en">{clip?.title}</span>
        {c && <span className="ar" dir="rtl">{c.ar}</span>}
      </div>
    </div>
  );
}
