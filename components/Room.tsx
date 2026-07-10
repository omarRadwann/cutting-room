"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { PANEL_H, RADIUS } from "@/lib/drum-config";
import { SHAFT_VERT, SHAFT_FRAG } from "@/lib/shaft-shader";
import { CLIPS } from "@/lib/content";
import { getUI } from "@/lib/ui-store";
import { scroll } from "@/lib/scroll-store";
import { drumState } from "@/lib/drum-state";
import { useQuality } from "@/lib/quality";
import SoundStage from "@/components/SoundStage";

const FLOOR_Y = -PANEL_H / 2 - 0.14;
const _c = new THREE.Color();
const clamp = THREE.MathUtils.clamp;
const damp = THREE.MathUtils.damp;
const TWO_PI = Math.PI * 2;
const wrap = (a: number) => (((a % TWO_PI) + TWO_PI + Math.PI) % TWO_PI) - Math.PI; // → [-π, π]

function useRadial() {
  return useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const ctx = c.getContext("2d")!; const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.5, "rgba(255,255,255,0.45)"); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
}
// (the beam's old canvas alpha gradient was replaced by the shared living shaft shader)

function LightPools({ radial }: { radial: THREE.Texture }) {
  const halo = useRef<THREE.MeshBasicMaterial>(null);
  const pool = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((s, dt) => {
    const g = CLIPS[getUI().front]?.grade ?? "#d8a24a"; _c.set(g); const k = 1 - Math.exp(-3 * dt);
    const breath = 0.5 * (0.88 + 0.12 * Math.sin(s.clock.elapsedTime * 0.5 + 1.3)); // the pool breathes with the lamps
    if (halo.current) { halo.current.color.lerp(_c, k); halo.current.opacity = breath; }
    if (pool.current) { pool.current.color.lerp(_c, k); pool.current.opacity = breath; }
  });
  return (
    <group>
      <mesh position={[0, 0.2, RADIUS - 0.7]}>
        <planeGeometry args={[6, 5]} />
        <meshBasicMaterial ref={halo} map={radial} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.02, RADIUS - 0.5]}>
        <planeGeometry args={[7, 7]} />
        <meshBasicMaterial ref={pool} map={radial} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Beam() {
  // the FEATURED film's beam — same living shader as the soundstage shafts (flowing noise, grade-tinted)
  const mat = useRef<THREE.ShaderMaterial>(null);
  const op = useRef(0);
  const top = PANEL_H * 0.85, height = top - FLOOR_Y;
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uColor: { value: new THREE.Color("#d8a24a") }, uOpacity: { value: 0 } }), []);
  useFrame((s, dt) => {
    const m = mat.current; if (!m) return;
    const ui = getUI();
    const g = CLIPS[ui.front]?.grade ?? "#d8a24a"; _c.set(g);
    (m.uniforms.uColor.value as THREE.Color).lerp(_c, 1 - Math.exp(-3 * dt));
    // fade in after the intro reveal, out at the colophon, off while focused (so it never veils a film)
    const inT = clamp((scroll.progress - 0.05) / 0.09, 0, 1);
    const outT = 1 - clamp((scroll.progress - 0.86) / 0.1, 0, 1);
    const breath = 0.88 + 0.12 * Math.sin(s.clock.elapsedTime * 0.55);
    const target = ui.focus !== null ? 0 : inT * outT * 0.6 * breath;
    op.current += (target - op.current) * (1 - Math.exp(-5 * dt));
    m.uniforms.uOpacity.value = op.current;
    m.uniforms.uTime.value = s.clock.elapsedTime;
  });
  return (
    <mesh position={[0, (top + FLOOR_Y) / 2, RADIUS - 0.25]} raycast={() => null}>
      <coneGeometry args={[2.15, height, 40, 1, true]} />
      <shaderMaterial ref={mat} vertexShader={SHAFT_VERT} fragmentShader={SHAFT_FRAG} uniforms={uniforms}
        transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Floor({ tier }: { tier: string }) {
  // SAFE: matte (no reflector pass). STANDARD + HIGH: a real planar reflector so each film mirrors
  // on the wet-obsidian floor (standard uses a cheaper 256 map). All receive the panel shadows.
  if (tier === "safe") {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, RADIUS * 0.1]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#0a0a10" roughness={0.5} metalness={0.35} />
      </mesh>
    );
  }
  const hi = tier === "high";
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, RADIUS * 0.1]} receiveShadow>
      <planeGeometry args={[120, 120]} />
      <MeshReflectorMaterial blur={hi ? [320, 120] : [320, 110]} resolution={hi ? 1024 : 192} mixBlur={1} mixStrength={hi ? 1.4 : 0.95} roughness={hi ? 0.75 : 0.88} depthScale={1.1} minDepthThreshold={0.4} maxDepthThreshold={1.2} color="#06070a" metalness={hi ? 0.72 : 0.58} />
    </mesh>
  );
}

/** slow-drifting dust motes catching the light — volumetric atmosphere */
function Dust({ count, radial }: { count: number; radial: THREE.Texture }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * RADIUS * 2.4;
      pos[i * 3 + 1] = (Math.random() - 0.5) * PANEL_H * 2.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * RADIUS * 2.4;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);
  useFrame((s, dt) => { if (ref.current) { ref.current.rotation.y += dt * 0.012; ref.current.position.y = Math.sin(s.clock.elapsedTime * 0.15) * 0.14; } });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.035} map={radial} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} color="#cdbfa0" sizeAttenuation />
    </points>
  );
}

/** enclosing cyclorama dome so gaps between panels never read as pure black (fog-immune, graded) */
function Backdrop() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 8; c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    // studio infinity-cove: cool deep near-black poles + a soft teal-blue soundstage glow behind the reel,
    // so the warm films read as the ONE source of warmth in a cold room (research: cool room, warm accent)
    g.addColorStop(0, "#05060a"); g.addColorStop(0.4, "#080b12"); g.addColorStop(0.6, "#12202b");
    g.addColorStop(0.76, "#0a0f16"); g.addColorStop(1, "#05070a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 8, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  return (
    <mesh>
      <sphereGeometry args={[46, 40, 24]} />
      <meshBasicMaterial map={tex} side={THREE.BackSide} fog={false} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

/** The featured film's spotlight rig — beam + back-glow + floor pool — GLIDES to whatever film the
 *  user leaves at front, even resting off-centre, so the star is always in the light: a real studio. */
function StageLight({ radial }: { radial: THREE.Texture }) {
  const grp = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const g = grp.current; if (!g) return;
    const tgt = g.rotation.y + wrap(drumState.frontAngle - g.rotation.y); // shortest path to the front film
    g.rotation.y = damp(g.rotation.y, tgt, 6, dt);
  });
  return (
    <group ref={grp}>
      <LightPools radial={radial} />
      <Beam />
    </group>
  );
}

export default function Room() {
  const q = useQuality();
  const radial = useRadial();
  return (
    <group>
      <Backdrop />
      <SoundStage tier={q.tier} />
      <Floor tier={q.tier} />
      <StageLight radial={radial} />
      {q.tier !== "safe" && <Dust count={q.tier === "high" ? 700 : 340} radial={radial} />}
    </group>
  );
}
