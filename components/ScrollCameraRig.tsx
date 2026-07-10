"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { scroll } from "@/lib/scroll-store";

/**
 * Drives the camera from scroll progress (0..1). Replace these keyframes with your storyboard
 * path, or swap for a baked CatmullRomCurve3 / exported camera track (see references/recipes.md).
 * Non-negotiable #3: scroll progress is the input device.
 */
const KEYS = [
  { at: 0.0, pos: new THREE.Vector3(0, 0, 6), look: new THREE.Vector3(0, 0, 0) },
  { at: 0.5, pos: new THREE.Vector3(2.4, 1.0, 4.0), look: new THREE.Vector3(0, 0, 0) },
  { at: 1.0, pos: new THREE.Vector3(-2.2, -1.0, 5.0), look: new THREE.Vector3(0, 0, 0) },
];

export default function ScrollCameraRig() {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3());

  useFrame(() => {
    const p = THREE.MathUtils.clamp(scroll.progress, 0, 1);
    let a = KEYS[0];
    let b = KEYS[KEYS.length - 1];
    for (let i = 0; i < KEYS.length - 1; i++) {
      if (p >= KEYS[i].at && p <= KEYS[i + 1].at) {
        a = KEYS[i];
        b = KEYS[i + 1];
        break;
      }
    }
    const t = (p - a.at) / Math.max(1e-5, b.at - a.at);
    camera.position.lerpVectors(a.pos, b.pos, t);
    look.current.lerpVectors(a.look, b.look, t);
    camera.lookAt(look.current);
  });

  return null;
}
