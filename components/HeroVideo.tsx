"use client";
import { useEffect, useRef, useState } from "react";
import { withBase } from "@/lib/withBase";
import { setHeroReady } from "@/lib/ui-store";

/**
 * Bespoke hero film — a full-screen video that owns the first screen and FADES to reveal the drum as you
 * scroll (opacity tied to --hero-op / data-phase). It is purely additive: until you drop your own
 * /media/hero.mp4 in, the <video> errors, the layer hides itself, and the drum's front film covers the
 * hero exactly as before. See docs/HERO-BRIEF.md for the "cutting room" concept to shoot/build.
 */
export default function HeroVideo() {
  const [ok, setOk] = useState(true);
  const vref = useRef<HTMLVideoElement>(null);

  // pause the decode once you've left the hero (saves the GPU for the drum); resume on return
  useEffect(() => {
    if (!ok) return;
    const root = document.documentElement;
    const sync = () => {
      const v = vref.current; if (!v) return;
      if (root.dataset.phase === "intro" || !root.dataset.phase) v.play().catch(() => {});
      else v.pause();
    };
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["data-phase"] });
    sync();
    return () => obs.disconnect();
  }, [ok]);

  if (!ok) return null;
  return (
    <div className="hero-video" aria-hidden="true">
      <video
        ref={vref}
        src={withBase("/media/hero.mp4")}
        poster={withBase("/media/hero.webp")}
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        onError={() => { setOk(false); setHeroReady(true); /* missing/undecodable video must never hold the loader */ }}
        onCanPlay={() => vref.current?.play().catch(() => {})}
        onCanPlayThrough={() => setHeroReady(true)}
      />
    </div>
  );
}
