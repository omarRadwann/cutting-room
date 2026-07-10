"use client";
import { useEffect } from "react";
import { scroll } from "@/lib/scroll-store";
import { getUI, setFocus, setIntro } from "@/lib/ui-store";
import { CLIPS } from "@/lib/content";

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/** Central UI phase driver (off the React tree): sets html[data-phase] (intro | browse | focus | outro)
 *  and --hero-op, so the DOM chrome shows/hides per moment without per-frame React re-renders. */
export default function UIState() {
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0, hero = 1;
    const loop = () => {
      const p = scroll.progress;
      const focused = getUI().focus !== null;
      const target = focused ? 0 : clamp(1 - p / 0.04, 0, 1); // hero copy fully clear before the reveal beat
      hero += (target - hero) * 0.16;
      root.style.setProperty("--hero-op", hero.toFixed(3));
      // scene recedes as the "how we work" section + colophon arrive, so the DOM reads clean
      const sceneOp = focused ? 1 : clamp(1 - (p - 0.58) / 0.09, 0.34, 1); // room stays a glowing backdrop, never a void
      root.style.setProperty("--scene-op", sceneOp.toFixed(3));
      root.style.setProperty("--prog", p.toFixed(4)); // the gold scroll hairline
      const phase = focused ? "focus" : p < 0.05 ? "intro" : p > 0.58 ? "outro" : "browse";
      if (root.dataset.phase !== phase) { root.dataset.phase = phase; setIntro(phase === "intro"); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // easter egg: press R for a random film (a projectionist's shuffle)
    const onKey = (e: KeyboardEvent) => {
      const t = (e.target as HTMLElement | null)?.tagName;
      if (t === "INPUT" || t === "TEXTAREA") return;
      if ((e.key === "r" || e.key === "R") && getUI().focus === null) {
        setFocus(Math.floor(Math.random() * CLIPS.length));
      }
    };
    window.addEventListener("keydown", onKey);

    // scroll reveals for tagged DOM ([data-reveal] → add .in when it enters view)
    const io = new IntersectionObserver(
      (entries) => { for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

    return () => { cancelAnimationFrame(raf); window.removeEventListener("keydown", onKey); io.disconnect(); };
  }, []);
  return null;
}
