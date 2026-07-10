"use client";
import { useUI, toggleMuted } from "@/lib/ui-store";
import { CLIPS, CHAPTERS } from "@/lib/content";

export default function SiteNav() {
  const ui = useUI();
  const chap = CLIPS[ui.focus ?? ui.front]?.chapter;
  const c = CHAPTERS.find((x) => x.key === chap);
  return (
    <nav className="nav">
      <div className="brand" data-magnetic>
        <span className="brand-en">FLOW</span>
        {/* the studio is FLOW; "The Cutting Room" stays as the descriptor of the place */}
        <span className="brand-sub">The Cutting Room · <span dir="rtl" lang="ar">غرفة المونتاج</span></span>
      </div>
      <div className="nav-right">
        <div className="nav-meta">
          <span className="k">Chapter</span>
          <span className="v">{c ? c.en : "—"}</span>
        </div>
        <button className="icon-btn" onClick={toggleMuted} data-clickable data-magnetic data-cursor aria-label={ui.muted ? "Turn sound on" : "Turn sound off"}>
          {ui.muted ? "Sound ○" : "Sound ●"}
        </button>
      </div>
    </nav>
  );
}
