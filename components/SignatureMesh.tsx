"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { vertexShader, fragmentShader } from "@/shaders/signature";
import { scroll } from "@/lib/scroll-store";

/**
 * The signature object. Placeholder = a fresnel + velocity-displaced icosahedron.
 * Replace with the concept's real hero (GLTF model, blob-mask plane, particle field, etc.).
 */
export default function SignatureMesh() {
  const uniforms = useRef({
    uTime: { value: 0 },
    uVelocity: { value: 0 },
    uColorA: { value: new THREE.Color("#ff6a3d") }, // accent
    uColorB: { value: new THREE.Color("#0a0a0b") }, // base
  });

  useFrame((_, dt) => {
    const u = uniforms.current;
    u.uTime.value += dt;
    // ease velocity so the warp decays smoothly after scrolling stops
    u.uVelocity.value += (Math.abs(scroll.velocity) - u.uVelocity.value) * 0.1;
  });

  return (
    <mesh>
      <icosahedronGeometry args={[1.6, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms.current}
      />
    </mesh>
  );
}
