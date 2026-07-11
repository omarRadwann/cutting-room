"use client";
import { useEffect } from "react";
import { useUI } from "@/lib/ui-store";
import { CLIPS } from "@/lib/content";
import { withBase } from "@/lib/withBase";

/**
 * After the curtain lifts, quietly pull the REST of the reel into the HTTP cache (the preloader
 * already warmed the first three films). One file at a time, scheduled on idle, starting well after
 * the hero settles — so it never competes with the hero decode or the first interaction. By the time
 * you spin the drum deep, every film starts instantly instead of buffering.
 */
export default function ReelPrefetch() {
  const { entered } = useUI();
  useEffect(() => {
    if (!entered) return;
    let cancelled = false;
    const rest = CLIPS.slice(3);
    const w = window as unknown as { requestIdleCallback?: (fn: () => void, o?: { timeout: number }) => number };
    const idle = (fn: () => void) => (w.requestIdleCallback ? w.requestIdleCallback(fn, { timeout: 4000 }) : window.setTimeout(fn, 900));
    let i = 0;
    const next = () => {
      if (cancelled || i >= rest.length) return;
      const c = rest[i++];
      fetch(withBase(c.src)).catch(() => {}).finally(() => { if (!cancelled) idle(next); });
    };
    const t = setTimeout(() => idle(next), 2600); // the hero owns the first breath
    return () => { cancelled = true; clearTimeout(t); };
  }, [entered]);
  return null;
}
