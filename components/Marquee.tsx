"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { scroll } from "@/lib/scroll-store";
import { prefersReducedMotion } from "@/lib/reduced-motion";

const LINE = "FILM — MOTION — 3D — CAIRO — THE CUTTING ROOM — ";

/**
 * Velocity-reactive kinetic marquee (the award-site type move): an outlined display band that drifts
 * forever, SPEEDS UP with your scroll and SKEWS into the velocity, settling upright at rest.
 * Two writers, no conflicts: rAF owns the track's translate, GSAP quickTo owns the wrapper's skew.
 */
export default function Marquee() {
  const skewEl = useRef<HTMLDivElement>(null);
  const trackEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sk = skewEl.current, tr = trackEl.current;
    if (!sk || !tr || prefersReducedMotion()) return;
    const qSkew = gsap.quickTo(sk, "skewX", { duration: 0.5, ease: "power2.out" });
    let x = 0, raf = 0;
    const loop = () => {
      const v = scroll.velocity;
      x -= 0.045 + Math.min(Math.abs(v) * 0.045, 0.5); // base drift + velocity boost (%/frame)
      if (x <= -50) x += 50;                            // content is doubled → seamless wrap at half
      tr.style.transform = `translateX(${x}%)`;
      qSkew(Math.max(-9, Math.min(9, -v * 1.1)));       // lean into the scroll
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="mq" aria-hidden="true">
      <div className="mq-skew" ref={skewEl}>
        <div className="mq-track" ref={trackEl}>
          <span>{LINE.repeat(3)}</span>
          <span>{LINE.repeat(3)}</span>
        </div>
      </div>
    </div>
  );
}
