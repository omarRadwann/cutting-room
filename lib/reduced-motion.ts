// Single source of truth for the reduced-motion preference.
// Used to flatten Lenis (lerp:1), disable the custom cursor, and simplify/stop heavy motion.
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
