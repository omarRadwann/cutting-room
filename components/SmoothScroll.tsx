"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scroll } from "@/lib/scroll-store";
import { prefersReducedMotion } from "@/lib/reduced-motion";

/**
 * THE single render clock. Lenis is driven from gsap.ticker (one rAF), ScrollTrigger updates
 * on Lenis scroll, and the WebGL useFrame loop reads the same scroll store — so DOM, GSAP and
 * canvas never desync. This is non-negotiable #1.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: "expo.out", duration: 0.9 }); // one shared motion signature
    const reduce = prefersReducedMotion();

    const lenis = new Lenis({
      lerp: reduce ? 1 : 0.08, // weightier, cinematic (research: 0.075–0.08 for a heavy drum)
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
      smoothWheel: !reduce,
      autoRaf: false, // we drive the loop ourselves (plain rAF, below)
    });
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis; // for lenis.scrollTo(anchor)

    lenis.on("scroll", (e: { progress: number; velocity: number }) => {
      scroll.progress = e.progress ?? 0;
      scroll.velocity = e.velocity ?? 0;
      ScrollTrigger.update();
    });

    // Drive Lenis with a plain rAF loop — reliable across StrictMode remounts. (The gsap.ticker path
    // silently stopped ticking here: wheel updated targetScroll but nothing animated it → dead scroll.)
    let rafId = 0;
    const raf = (time: number) => { lenis.raf(time); rafId = requestAnimationFrame(raf); };
    rafId = requestAnimationFrame(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      (window as unknown as { __lenis?: Lenis }).__lenis = undefined;
    };
  }, []);

  return <>{children}</>;
}
