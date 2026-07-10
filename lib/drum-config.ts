// Drum layout that shows each film at its NATIVE aspect: uniform height, width = height * aspect,
// panels distributed evenly around the cylinder by their true arc so wide and tall films coexist.
import { CLIPS } from "@/lib/content";

const TWO_PI = Math.PI * 2;
export const PANEL_H = 2.55;
const GAP = 0.8;
const N = CLIPS.length;
const widths = CLIPS.map((c) => PANEL_H * c.aspect);

// smallest radius that fits every panel + gap inside the circle, then a little breathing room
const arcSum = (r: number) => widths.reduce((s, w) => s + 2 * Math.asin(Math.min(0.98, w / 2 / r)), 0);
let R = 3;
while (arcSum(R) + N * (GAP / R) > TWO_PI && R < 80) R += 0.05;
R *= 1.14;
export const RADIUS = R;

// even layout: spread the leftover circle as extra gap between panels
const baseArcs = widths.map((w) => 2 * Math.asin(Math.min(0.98, w / 2 / R)));
const gapArc = (TWO_PI - baseArcs.reduce((a, b) => a + b, 0)) / N;

export type PanelLayout = { index: number; angle: number; width: number; height: number };
export const PANELS: PanelLayout[] = (() => {
  const out: PanelLayout[] = [];
  let cursor = 0;
  for (let i = 0; i < N; i++) {
    out.push({ index: i, angle: cursor + baseArcs[i] / 2, width: widths[i], height: PANEL_H });
    cursor += baseArcs[i] + gapArc;
  }
  return out;
})();
export const N_PANELS = N;

/** distance a camera needs to FIT a (w×h) plane at a vertical fov + viewport aspect (letterbox) */
export function focusDistFor(w: number, h: number, fovDeg: number, viewAspect: number) {
  const vfov = (fovDeg * Math.PI) / 180;
  const distH = h / 2 / Math.tan(vfov / 2);
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * viewAspect);
  const distW = w / 2 / Math.tan(hfov / 2);
  return Math.max(distH, distW);
}
/** distance so a (w×h) plane COVERS the viewport (fills, overflowing the other dimension) */
export function coverDistFor(w: number, h: number, fovDeg: number, viewAspect: number) {
  const vfov = (fovDeg * Math.PI) / 180;
  const distH = h / 2 / Math.tan(vfov / 2);
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * viewAspect);
  const distW = w / 2 / Math.tan(hfov / 2);
  return Math.min(distH, distW);
}

const maxW = Math.max(...widths);
export const DRUM = {
  radius: R,
  camY: 0.08,
  fov: 38,
  // browse distance frames the widest film + shows the neighbours (nominal 1.5 viewport aspect)
  browseDist: focusDistFor(maxW, PANEL_H, 38, 1.5) * 1.7,
  browseFrom: 0.05,
  browseTo: 0.55, // browsing completes BEFORE the "How we work" heading scrolls in (no text-over-film collision)
};
