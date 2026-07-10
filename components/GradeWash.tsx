"use client";
import { useEffect, useRef } from "react";
import { scroll } from "@/lib/scroll-store";
import { getUI } from "@/lib/ui-store";
import { CLIPS } from "@/lib/content";

/** A full-screen film of the front clip's colour grade, brightened by scroll velocity — the
 *  "the room takes on the colour of the work" wash. rAF-driven off the React tree (no re-renders). */
export default function GradeWash() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0, cur = 0;
    const loop = () => {
      const el = ref.current;
      if (el) {
        const g = CLIPS[getUI().front]?.grade ?? "#d8a24a";
        el.style.backgroundColor = g;
        const v = Math.min(1, Math.abs(scroll.velocity) / 38);
        const target = 0.05 + v * 0.24;
        cur += (target - cur) * 0.08;
        el.style.opacity = cur.toFixed(3);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div ref={ref} className="grade-wash" aria-hidden="true" />;
}
