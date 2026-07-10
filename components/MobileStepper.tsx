"use client";
import { getUI } from "@/lib/ui-store";
import { CLIPS } from "@/lib/content";
import { DRUM } from "@/lib/drum-config";

const N = CLIPS.length;

/** Phone-size film navigation (the desktop film-index is hidden < 900px): two steppers that glide the
 *  reel to the previous/next film by scrolling Lenis to that film's exact progress. Browse phase only. */
export default function MobileStepper() {
  const step = (dir: -1 | 1) => {
    const ui = getUI();
    if (ui.focus !== null) return;
    const i = Math.max(0, Math.min(N - 1, ui.front + dir));
    const L = (window as unknown as { __lenis?: { limit: number; scrollTo: (v: number, o?: object) => void } }).__lenis;
    if (!L) return;
    const p = DRUM.browseFrom + (DRUM.browseTo - DRUM.browseFrom) * (i / (N - 1));
    L.scrollTo(p * L.limit, { duration: 0.9 });
  };
  return (
    <div className="m-step" aria-hidden="false">
      <button onClick={() => step(-1)} aria-label="Previous film" data-clickable>‹</button>
      <button onClick={() => step(1)} aria-label="Next film" data-clickable>›</button>
    </div>
  );
}
