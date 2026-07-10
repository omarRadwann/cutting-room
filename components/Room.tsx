"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { withBase } from "@/lib/withBase";
import { PANEL_H, RADIUS } from "@/lib/drum-config";
import { SHAFT_VERT, SHAFT_FRAG } from "@/lib/shaft-shader";
import { CLIPS } from "@/lib/content";
import { getUI } from "@/lib/ui-store";
import { scroll } from "@/lib/scroll-store";
import { drumState } from "@/lib/drum-state";
import { useQuality } from "@/lib/quality";
import { goboTex } from "@/lib/gobo-texture";
import SoundStage from "@/components/SoundStage";

const FLOOR_Y = -PANEL_H / 2 - 0.14;
const _c = new THREE.Color();
const clamp = THREE.MathUtils.clamp;
const damp = THREE.MathUtils.damp;
const TWO_PI = Math.PI * 2;
const wrap = (a: number) => (((a % TWO_PI) + TWO_PI + Math.PI) % TWO_PI) - Math.PI; // → [-π, π]

/** Painted stage markings — circle guides under the reel, tape crosses at the fixture feet, and the
 *  arced production stencil. One 2048 canvas, one decal plane, all tiers (module-cached). */
let _markTex: THREE.CanvasTexture | null = null;
function markingsTex(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  if (_markTex) return _markTex;
  const SIZE = 2048, WORLD = RADIUS * 2.6, s = SIZE / WORLD, C = SIZE / 2;
  const c = document.createElement("canvas"); c.width = c.height = SIZE;
  const ctx = c.getContext("2d")!;
  const px = (wx: number, wz: number) => [C + wx * s, C + wz * s] as const;
  // dashed circle guides either side of the dolly track
  ctx.strokeStyle = "rgba(232,225,210,0.34)"; ctx.lineWidth = 3; ctx.setLineDash([26, 30]);
  for (const r of [RADIUS - 0.62, RADIUS + 0.62]) { ctx.beginPath(); ctx.arc(C, C, r * s, 0, Math.PI * 2); ctx.stroke(); }
  ctx.setLineDash([]);
  // gold tape crosses at the light-tree + tripod feet
  ctx.strokeStyle = "rgba(216,162,74,0.5)"; ctx.lineWidth = 5;
  const cross = (wx: number, wz: number) => { const [x, y] = px(wx, wz); const a = 0.16 * s; ctx.beginPath(); ctx.moveTo(x - a, y); ctx.lineTo(x + a, y); ctx.moveTo(x, y - a); ctx.lineTo(x, y + a); ctx.stroke(); };
  for (const x of [-3.4, -1.15, 1.15, 3.4]) cross(x, -RADIUS * 0.5 - 0.14);
  cross(-6.4, RADIUS * 0.55); cross(6.6, RADIUS * 0.62);
  // the production stencil, arced along the front guide
  ctx.fillStyle = "rgba(232,225,210,0.4)"; ctx.font = '600 46px "JetBrains Mono", monospace';
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const label = "STAGE 01 · THE CUTTING ROOM";
  const rText = (RADIUS + 1.35) * s, arc = 0.62; // radians of total sweep, centred at the front
  for (let i = 0; i < label.length; i++) {
    const t = i / (label.length - 1) - 0.5, a = t * arc; // 0 at front centre
    ctx.save();
    ctx.translate(C + Math.sin(a) * rText, C + Math.cos(a) * rText);
    ctx.rotate(-a); // upright to a viewer standing in front
    ctx.fillText(label[i], 0, 0);
    ctx.restore();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  _markTex = t; return t;
}

function StageMarkings() {
  const tex = useMemo(() => markingsTex(), []);
  if (!tex) return null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.008, 0]} renderOrder={2} raycast={() => null}>
      <planeGeometry args={[RADIUS * 2.6, RADIUS * 2.6]} />
      <meshBasicMaterial map={tex} transparent opacity={0.85} depthWrite={false} />
    </mesh>
  );
}

/** ground haze — a warm luminous band hugging the floor behind the reel (peak kept under the bloom threshold) */
function GroundHaze() {
  const tex = useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas"); c.width = 4; c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 128, 0, 0);
    g.addColorStop(0, "rgba(255,226,184,0.32)"); g.addColorStop(0.55, "rgba(255,226,184,0.1)"); g.addColorStop(1, "rgba(255,226,184,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  if (!tex) return null;
  return (
    <mesh position={[0, FLOOR_Y + 0.7, -2.0]} raycast={() => null}>
      <planeGeometry args={[RADIUS * 2.6, 1.5]} />
      <meshBasicMaterial map={tex} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
    </mesh>
  );
}

/** warm glow bleeding through the back service door (fog-immune — the shell's door frame holds it) */
function DoorGlow() {
  const tex = useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas"); c.width = 64; c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(32, 100, 4, 32, 80, 96);
    g.addColorStop(0, "rgba(255,214,160,0.5)"); g.addColorStop(0.55, "rgba(255,200,140,0.16)"); g.addColorStop(1, "rgba(255,200,140,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  if (!tex) return null;
  return (
    <mesh position={[0, FLOOR_Y + 1.3, -10.35]} raycast={() => null}>
      <planeGeometry args={[1.5, 2.7]} />
      <meshBasicMaterial map={tex} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
    </mesh>
  );
}

/** the monumental painted "01" beside the door — deep-stage signage (fog-immune, one plane) */
function StageSign() {
  const tex = useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas"); c.width = 256; c.height = 256;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "rgba(220,233,255,0.85)";
    ctx.font = '300 190px Georgia, "Times New Roman", serif';
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("01", 128, 140);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  if (!tex) return null;
  return (
    <mesh position={[3.6, FLOOR_Y + 2.5, -10.3]} raycast={() => null}>
      <planeGeometry args={[2.4, 2.4]} />
      <meshBasicMaterial map={tex} transparent opacity={0.16} depthWrite={false} toneMapped={false} fog={false} />
    </mesh>
  );
}

/** polished-concrete roughness variation — dark streaks = sharper reflection lanes (data map, linear) */
let _roughTex: THREE.CanvasTexture | null = null;
function roughnessTex(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  if (_roughTex) return _roughTex;
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#e6e6e6"; ctx.fillRect(0, 0, 512, 512); // base ~0.9 roughness
  for (let i = 0; i < 46; i++) { // long polished wear streaks
    const y = Math.random() * 512, w = 30 + Math.random() * 150, h = 4 + Math.random() * 16;
    const v = 120 + Math.floor(Math.random() * 70); // 0.47–0.75 → locally glossier
    ctx.fillStyle = `rgba(${v},${v},${v},${0.25 + Math.random() * 0.3})`;
    ctx.beginPath(); ctx.ellipse(Math.random() * 512, y, w, h, Math.random() * 0.4 - 0.2, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < 900; i++) { // speckle
    const v = 150 + Math.floor(Math.random() * 90);
    ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1.6, 1.6);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace; // DATA map — sRGB decode would wreck the response
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 10); t.anisotropy = 4;
  _roughTex = t; return t;
}

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
  const rough = roughnessTex();
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, RADIUS * 0.1]} receiveShadow>
      <planeGeometry args={[120, 120]} />
      <MeshReflectorMaterial blur={hi ? [320, 120] : [380, 140]} resolution={hi ? 1024 : 128} mixBlur={1} mixStrength={hi ? 1.4 : 0.88} roughness={hi ? 0.78 : 0.9} roughnessMap={rough ?? undefined} depthScale={1.1} minDepthThreshold={0.4} maxDepthThreshold={1.2} color="#06070a" metalness={hi ? 0.72 : 0.58} />
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

/** The Blender-built soundstage shell — acoustic baffle wall, ceiling beam grid, angled side flats.
 *  ONE merged mesh with Cycles-baked VERTEX AO (real soft occlusion in every crevice, zero runtime cost,
 *  one draw call). Built + baked headless by blender/build_stage_shell.py. */
function StageShell() {
  const { scene } = useGLTF(withBase("/models/stage-shell.glb"));
  useMemo(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#151a24"), roughness: 0.85, metalness: 0.3,
          vertexColors: true, envMapIntensity: 0.75,
        });
        m.raycast = () => null;
      }
    });
  }, [scene]);
  return <primitive object={scene} />;
}

/** The featured film's spotlight rig — beam + back-glow + floor pool + the film-gate SLATS — GLIDES to
 *  whatever film the user leaves at front, even resting off-centre, so the star is always in the light. */
function StageLight({ radial }: { radial: THREE.Texture }) {
  const grp = useRef<THREE.Group>(null);
  const gobo = useMemo(() => goboTex(), []);
  useFrame((_, dt) => {
    const g = grp.current; if (!g) return;
    const tgt = g.rotation.y + wrap(drumState.frontAngle - g.rotation.y); // shortest path to the front film
    g.rotation.y = damp(g.rotation.y, tgt, 6, dt);
  });
  return (
    <group ref={grp}>
      <LightPools radial={radial} />
      <Beam />
      {/* film-gate slats raking the floor in front of the featured film (zero-light additive plane —
          the profile-gated replacement for the retired gobo SpotLight) */}
      {gobo && (
        <mesh rotation={[-Math.PI / 2, 0, 0.22]} position={[0.6, FLOOR_Y + 0.012, RADIUS - 1.7]} renderOrder={3} raycast={() => null}>
          <planeGeometry args={[6.4, 4.2]} />
          <meshBasicMaterial map={gobo} transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
        </mesh>
      )}
    </group>
  );
}

export default function Room() {
  const q = useQuality();
  const radial = useRadial();
  return (
    <group>
      <Backdrop />
      <StageShell />
      <SoundStage tier={q.tier} />
      <Floor tier={q.tier} />
      <StageMarkings />
      <GroundHaze />
      <DoorGlow />
      <StageSign />
      <StageLight radial={radial} />
      {q.tier !== "safe" && <Dust count={q.tier === "high" ? 700 : 220} radial={radial} />}
    </group>
  );
}
