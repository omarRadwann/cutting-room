"use client";
import { useEffect } from "react";
import { audioEngine } from "@/lib/audioEngine";
import { useUI, getUI } from "@/lib/ui-store";
import { scroll } from "@/lib/scroll-store";

/**
 * Wires the procedural audio engine (no asset): a scroll-velocity "air" that swells as you spin the drum,
 * and a soft detent tick when a film settles to front. Opt-in — silent until the SOUND toggle is on
 * (ui.muted defaults true). If you later drop /audio/ambient.mp3 in, call audioEngine.initBed() for a bed.
 */
export default function AudioLayer() {
  const { muted, front } = useUI();

  // resume the AudioContext on the first real gesture (wheel counts for the wind)
  useEffect(() => {
    const go = () => audioEngine.unlock();
    const evs = ["wheel", "touchstart", "click", "keydown"];
    evs.forEach((t) => window.addEventListener(t, go, { once: true, passive: true }));
    return () => evs.forEach((t) => window.removeEventListener(t, go));
  }, []);

  // master follows the SOUND toggle
  useEffect(() => { audioEngine.setMuted(muted); }, [muted]);

  // scroll-velocity "air" — silent at rest, breathes louder the faster the drum spins
  useEffect(() => {
    let raf = 0;
    const loop = () => { audioEngine.setMotion(Math.min(1, Math.abs(scroll.velocity) * 0.4)); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // a soft detent when a NEW film settles to front (gate on low velocity so a fast spin doesn't machine-gun)
  useEffect(() => {
    if (getUI().muted) return;
    if (Math.abs(scroll.velocity) < 0.25) audioEngine.playCue("tick");
  }, [front]);

  return null;
}
