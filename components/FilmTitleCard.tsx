"use client";
import { useUI } from "@/lib/ui-store";
import { CLIPS, CHAPTERS } from "@/lib/content";

/**
 * The cinema TITLE CARD — every film is ANNOUNCED, not labelled. As a film takes the front of the
 * drum, its title lands in display type at the lower third (index, name, Arabic register), replaying
 * a rise on each changeover like a premiere card. This is the editorial scale the browse beat was
 * missing: the eye gets a headline moment with every film, and the dark floor stops reading empty.
 * Browse-only (the focus overlay and the outro have their own voices). Replaces the old corner HUD.
 */
export default function FilmTitleCard() {
  const ui = useUI();
  const idx = ui.front;
  const clip = CLIPS[idx];
  if (!clip) return null;
  const ch = CHAPTERS.find((c) => c.key === clip.chapter);
  return (
    <div className="title-card" aria-hidden="true">
      {/* re-keyed → the rise REPLAYS on every changeover */}
      <div key={idx} className="title-card-in">
        <span className="tc-index">{String(idx + 1).padStart(2, "0")} / {String(CLIPS.length).padStart(2, "0")} — {clip.campaign}</span>
        <span className="tc-name">{clip.title}</span>
        {ch && <span className="tc-ar" dir="rtl">{ch.ar}</span>}
      </div>
    </div>
  );
}
