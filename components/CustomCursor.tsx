"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/reduced-motion";
import { pointerNorm } from "@/lib/drum-state";

/**
 * Two-element cursor: a fast dot + a trailing ring, with states — "ui" over links/buttons,
 * "view" over a film (shows a label), default otherwise. Plus magnetic pull on [data-magnetic].
 * quickTo per the studio-craft research (dot ~0.15s, ring ~0.5s). Skipped for touch/reduced-motion.
 */
export default function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;
    const root = document.documentElement;
    root.classList.add("has-custom-cursor");
    const dEl = dot.current!, rEl = ring.current!;
    gsap.set([dEl, rEl], { xPercent: -50, yPercent: -50 });

    const dx = gsap.quickTo(dEl, "x", { duration: 0.14, ease: "power3" });
    const dy = gsap.quickTo(dEl, "y", { duration: 0.14, ease: "power3" });
    const rx = gsap.quickTo(rEl, "x", { duration: 0.5, ease: "power3" });
    const ry = gsap.quickTo(rEl, "y", { duration: 0.5, ease: "power3" });

    let shown = false;
    const move = (e: PointerEvent) => {
      if (!shown) { shown = true; gsap.set([dEl, rEl], { x: e.clientX, y: e.clientY }); root.classList.add("cur-on"); } // appear AT the pointer, never at (0,0)
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      pointerNorm.x = (e.clientX / innerWidth) * 2 - 1; pointerNorm.y = (e.clientY / innerHeight) * 2 - 1;
    };
    const over = (e: Event) => {
      const t = e.target as HTMLElement;
      const overUI = !!t.closest("a,button,[data-cursor]");
      const overFilm = root.dataset.hovering === "1";
      root.dataset.cursor = overUI ? "ui" : overFilm ? "view" : "default";
    };
    addEventListener("pointermove", move, { passive: true });
    addEventListener("pointerover", over, { passive: true });

    // magnetic pull on tagged controls
    const cleanups: Array<() => void> = [];
    document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((m) => {
      const qx = gsap.quickTo(m, "x", { duration: 0.4, ease: "power3" });
      const qy = gsap.quickTo(m, "y", { duration: 0.4, ease: "power3" });
      const mm = (e: PointerEvent) => { const r = m.getBoundingClientRect(); qx((e.clientX - (r.left + r.width / 2)) * 0.35); qy((e.clientY - (r.top + r.height / 2)) * 0.35); };
      const leave = () => gsap.to(m, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.3)" });
      // press feedback lives HERE (GSAP owns these transforms — a CSS :active scale would be overwritten)
      const down = () => gsap.to(m, { scale: 0.97, duration: 0.12, ease: "power2.out" });
      const up = () => gsap.to(m, { scale: 1, duration: 0.22, ease: "power2.out" });
      m.addEventListener("pointermove", mm); m.addEventListener("pointerleave", leave);
      m.addEventListener("pointerdown", down); m.addEventListener("pointerup", up);
      cleanups.push(() => { m.removeEventListener("pointermove", mm); m.removeEventListener("pointerleave", leave); m.removeEventListener("pointerdown", down); m.removeEventListener("pointerup", up); });
    });

    return () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerover", over);
      cleanups.forEach((c) => c());
      root.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <>
      <div ref={ring} aria-hidden="true" className="cur-ring"><span className="cur-label">View</span></div>
      <div ref={dot} aria-hidden="true" className="cur-dot" />
    </>
  );
}
