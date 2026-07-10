"use client";
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scroll } from "@/lib/scroll-store";
import { getUI } from "@/lib/ui-store";
import { DRUM, PANELS, focusDistFor, coverDistFor } from "@/lib/drum-config";

const damp = THREE.MathUtils.damp;
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;

/**
 * One damped camera.
 *  • Hero (p≈0): the front film COVERS the whole viewport, head-on — a full-screen film.
 *  • Scroll (p 0→0.1): the camera pulls back and the drum/slider is revealed.
 *  • Focus: dolly in and frame the film by its own aspect.
 */
export default function CinematicRig() {
  const cam = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const look = useRef(new THREE.Vector3(0, 0, DRUM.radius));
  const lookTarget = new THREE.Vector3();

  useFrame((_, dt) => {
    const p = scroll.progress;
    const ui = getUI();
    const aspect = size.width / Math.max(1, size.height);
    const reveal = clamp(p / 0.1, 0, 1); // 0 = full-screen hero → 1 = drum browse

    const FOCUS_FOV = 34; // lens leans in on focus; distance is computed at the SAME fov so the film still fits
    let targetZ: number, targetY: number, lookY: number;
    if (ui.focus !== null) {
      const pn = PANELS[ui.focus];
      targetZ = DRUM.radius + focusDistFor(pn.width, pn.height, FOCUS_FOV, aspect) * 1.05;
      targetY = 0; lookY = 0;
    } else {
      const pn = PANELS[ui.front] ?? PANELS[0];
      const coverZ = DRUM.radius + coverDistFor(pn.width, pn.height, DRUM.fov, aspect); // fills the screen
      const browseZ = DRUM.radius + DRUM.browseDist;
      targetZ = lerp(coverZ, browseZ, reveal);
      targetY = lerp(0, DRUM.camY, reveal);
      lookY = lerp(0, 0.04, reveal);
    }
    const k = ui.focus !== null ? 3.0 : 2.4;
    // velocity sway — the camera leans into the scroll like a dolly grip, settling back at rest
    const sway = ui.focus !== null ? 0 : clamp(scroll.velocity * 0.05, -0.26, 0.26);
    cam.position.x = damp(cam.position.x, sway, 2.1, dt);
    cam.position.y = damp(cam.position.y, targetY, k, dt);
    cam.position.z = damp(cam.position.z, targetZ, k, dt);

    lookTarget.set(0, lookY, DRUM.radius);
    look.current.x = damp(look.current.x, lookTarget.x, k, dt);
    look.current.y = damp(look.current.y, lookTarget.y, k, dt);
    look.current.z = damp(look.current.z, lookTarget.z, k, dt);
    cam.lookAt(look.current);

    // FOV breath — the dolly-zoom compression of stepping into a screening
    const pc = cam as THREE.PerspectiveCamera;
    const fovTarget = ui.focus !== null ? FOCUS_FOV : DRUM.fov;
    const nf = damp(pc.fov, fovTarget, 2.6, dt);
    if (Math.abs(nf - pc.fov) > 0.0005) { pc.fov = nf; pc.updateProjectionMatrix(); }
  });

  return null;
}
