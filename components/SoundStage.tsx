"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RADIUS, PANEL_H } from "@/lib/drum-config";
import { SHAFT_VERT, SHAFT_FRAG } from "@/lib/shaft-shader";
import { getUI } from "@/lib/ui-store";

const noRaycast = () => null;
const damp1 = THREE.MathUtils.damp;
const FLOOR_Y = -PANEL_H / 2 - 0.14;

/** LED softbox face — a dark panel with a grid of bright rounded cells, like the studio lights in the hero. */
function useLED() {
  return useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#080a10"; ctx.fillRect(0, 0, 128, 128);
    const cols = 4, rows = 3, pad = 16, cw = (128 - pad * 2) / cols, ch = (128 - pad * 2) / rows;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const cx = pad + cw * (x + 0.5), cy = pad + ch * (y + 0.5), r = Math.min(cw, ch) * 0.36;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.55, "rgba(226,238,255,0.92)"); g.addColorStop(1, "rgba(150,190,255,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
}

/** A softbox lamp whose glow BREATHES (each out of phase) with a faint tungsten flicker — studio life. */
function Softbox({ position, rotation = [0, 0, 0], w, h, tint, led, phase }: {
  position: [number, number, number]; rotation?: [number, number, number]; w: number; h: number; tint: string; led: THREE.Texture; phase: number;
}) {
  const face = useRef<THREE.MeshBasicMaterial>(null);
  const base = useMemo(() => new THREE.Color(tint), [tint]);
  const dim = useRef(1);
  useFrame((s, dt) => {
    const m = face.current; if (!m) return;
    const t = s.clock.elapsedTime;
    // step the house lights back while a film is focused — the star owns the room
    dim.current = damp1(dim.current, getUI().focus !== null ? 0.45 : 1, 4, dt);
    const breath = 0.78 + 0.22 * (0.5 + 0.5 * Math.sin(t * (0.45 + phase * 0.3) + phase * 6.283)) + 0.03 * Math.sin(t * 6.7 + phase * 11.0);
    m.color.copy(base).multiplyScalar(breath * dim.current);
  });
  return (
    <group position={position} rotation={rotation}>
      <mesh raycast={noRaycast}><boxGeometry args={[w + 0.14, h + 0.14, 0.16]} /><meshStandardMaterial color="#141824" metalness={0.6} roughness={0.42} envMapIntensity={1.3} /></mesh>
      <mesh position={[0, 0, 0.09]} raycast={noRaycast}><planeGeometry args={[w, h]} />
        <meshBasicMaterial ref={face} map={led} color={tint} toneMapped={false} fog={false} transparent /></mesh>
    </group>
  );
}

// shaft shader shared with the featured-film tracking beam — lib/shaft-shader.ts

/** A living volumetric shaft — flowing noise inside, pivoting gently from the LAMP (top), not wobbling mid-air. */
function Shaft({ lamp, base, height, tint, opacity, phase }: {
  lamp: [number, number, number]; base: number; height: number; tint: string; opacity: number; phase: number;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const grp = useRef<THREE.Group>(null);
  const dim = useRef(1);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uColor: { value: new THREE.Color(tint) }, uOpacity: { value: opacity } }), [tint, opacity]);
  useFrame((s, dt) => {
    // write through the LIVE material ref — R3F clones the uniforms prop object (known gotcha)
    dim.current = damp1(dim.current, getUI().focus !== null ? 0.18 : 1, 4, dt); // shafts recede in focus mode
    if (mat.current) {
      mat.current.uniforms.uTime.value = s.clock.elapsedTime + phase * 3.0;
      mat.current.uniforms.uOpacity.value = opacity * dim.current;
    }
    if (grp.current) grp.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.22 + phase * 2.0) * 0.03; // sway from the lamp
  });
  return (
    <group ref={grp} position={lamp}>
      <mesh position={[0, -height / 2, 0]} raycast={noRaycast}>
        <coneGeometry args={[base, height, 30, 1, true]} />
        <shaderMaterial ref={mat} vertexShader={SHAFT_VERT} fragmentShader={SHAFT_FRAG} uniforms={uniforms}
          transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Circular DOLLY TRACK under the drum — the films ride the studio's camera track (echoes the hero film's
 *  dolly rails). Two metal rails + instanced sleepers; catches the key light, the shadows and the reflector. */
function DollyTrack() {
  const sleepers = useRef<THREE.InstancedMesh>(null);
  const N = 36;
  useEffect(() => {
    const m = sleepers.current; if (!m) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      dummy.position.set(Math.sin(a) * RADIUS, FLOOR_Y + 0.014, Math.cos(a) * RADIUS);
      dummy.rotation.set(0, a, 0); // long axis pointing radially, under both rails
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <group>
      {[RADIUS - 0.3, RADIUS + 0.3].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.032, 0]} raycast={noRaycast}>
          <torusGeometry args={[r, 0.028, 8, 80]} />
          <meshStandardMaterial color="#2a2d36" metalness={0.95} roughness={0.32} envMapIntensity={1.5} />
        </mesh>
      ))}
      <instancedMesh ref={sleepers} args={[undefined, undefined, N]} raycast={noRaycast}>
        <boxGeometry args={[0.94, 0.035, 0.15]} />
        <meshStandardMaterial color="#121419" metalness={0.5} roughness={0.6} />
      </instancedMesh>
    </group>
  );
}

/** Vertical light trees under the back wall — the floating softboxes become mounted fixtures. */
function LightTrees() {
  const xs = [-3.4, -1.15, 1.15, 3.4];
  const z = -RADIUS * 0.5;
  return (
    <group>
      {xs.map((x) => (
        <group key={x} position={[x, 0, z - 0.14]}>
          <mesh position={[0, (FLOOR_Y + 1.8) / 2, 0]} raycast={noRaycast}>
            <cylinderGeometry args={[0.026, 0.026, 1.8 - FLOOR_Y, 8]} />
            <meshStandardMaterial color="#0c0e14" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[0, FLOOR_Y + 0.03, 0]} raycast={noRaycast}>
            <cylinderGeometry args={[0.19, 0.23, 0.06, 16]} />
            <meshStandardMaterial color="#0b0d12" metalness={0.6} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Two tripod silhouettes at the frame edges — foreground depth, like standing in the crew line. */
function Tripods() {
  const legs = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
  const H = 1.5;
  return (
    <group>
      {[[-6.4, RADIUS * 0.55, 0.25], [6.6, RADIUS * 0.62, -0.2]].map(([x, z, rot], ti) => (
        <group key={ti} position={[x, FLOOR_Y, z]} rotation={[0, rot, 0]}>
          {legs.map((a) => (
            <mesh key={a} position={[Math.sin(a) * 0.34, H / 2, Math.cos(a) * 0.34]} rotation={[Math.cos(a) * 0.42, 0, -Math.sin(a) * 0.42]} raycast={noRaycast}>
              <cylinderGeometry args={[0.02, 0.028, H, 6]} />
              <meshStandardMaterial color="#0a0c11" metalness={0.65} roughness={0.45} />
            </mesh>
          ))}
          <mesh position={[0, H + 0.1, 0]} raycast={noRaycast}>
            <boxGeometry args={[0.34, 0.2, 0.24]} />
            <meshStandardMaterial color="#0b0d13" metalness={0.75} roughness={0.35} envMapIntensity={1.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * The film studio the reel lives inside — matched to the hero soundstage. An overhead key truss + a back wall
 * of softboxes glowing THROUGH the drum gaps — now ALIVE: every lamp breathes out of phase with a tungsten
 * flicker, and each shaft is a shader volumetric with flowing noise, swaying from its lamp. Fog-immune
 * emissives → cheap on the iGPU, and it all reflects on the floor.
 */
export default function SoundStage({ tier }: { tier: string }) {
  const led = useLED();
  const cool = "#dce9ff", warm = "#ffe6c2";

  const back = useMemo(() => {
    const z = -RADIUS * 0.5, out: { p: [number, number, number]; t: string }[] = [];
    const xs = [-3.4, -1.15, 1.15, 3.4], ys = [1.35, -0.6];
    for (const y of ys) for (const x of xs) out.push({ p: [x, y, z], t: y > 0 ? cool : "#bcd4ff" });
    return out;
  }, []);
  const over = useMemo(() => {
    const y = 3.3, z = RADIUS * 0.18, out: { p: [number, number, number]; t: string }[] = [];
    for (const x of [-4.2, -1.4, 1.4, 4.2]) out.push({ p: [x, y, z], t: warm });
    return out;
  }, []);
  const hi = tier === "high";
  const shaftZ = RADIUS * 0.18 + 0.4;

  return (
    <group>
      {/* the set: circular dolly track under the reel, light trees, foreground tripods */}
      <DollyTrack />
      <LightTrees />
      {tier !== "safe" && <Tripods />}

      {/* back light wall — glows through the drum gaps */}
      {back.map((b, i) => <Softbox key={"b" + i} position={b.p} w={1.5} h={1.05} tint={b.t} led={led} phase={(i + 1) * 0.37} />)}

      {/* overhead key truss + hanging lamps */}
      <mesh position={[0, 3.55, RADIUS * 0.18]} raycast={noRaycast}><boxGeometry args={[10, 0.14, 0.14]} /><meshStandardMaterial color="#0b0d12" metalness={0.7} roughness={0.4} /></mesh>
      {over.map((o, i) => (
        <group key={"o" + i}>
          <mesh position={[o.p[0], 3.45, o.p[2]]} raycast={noRaycast}><cylinderGeometry args={[0.02, 0.02, 0.35, 6]} /><meshStandardMaterial color="#0b0d12" /></mesh>
          <Softbox position={o.p} rotation={[0.62, 0, 0]} w={1.35} h={0.92} tint={o.t} led={led} phase={(i + 1) * 0.53 + 2.0} />
        </group>
      ))}

      {/* living volumetric shafts under each overhead lamp (denser rig on high) */}
      {tier !== "safe" && (
        <>
          <Shaft lamp={[-4.2, 3.2, shaftZ]} base={1.5} height={4.7} tint={warm} opacity={0.42} phase={0.0} />
          <Shaft lamp={[-1.4, 3.25, shaftZ]} base={1.7} height={4.9} tint={warm} opacity={0.5} phase={1.1} />
          <Shaft lamp={[1.4, 3.25, shaftZ]} base={1.7} height={4.9} tint={warm} opacity={0.5} phase={2.2} />
          <Shaft lamp={[4.2, 3.2, shaftZ]} base={1.5} height={4.7} tint={warm} opacity={0.42} phase={3.3} />
          {hi && <Shaft lamp={[-3.4, 1.6, -RADIUS * 0.5 + 0.4]} base={1.3} height={4.0} tint={cool} opacity={0.34} phase={4.4} />}
          {hi && <Shaft lamp={[3.4, 1.6, -RADIUS * 0.5 + 0.4]} base={1.3} height={4.0} tint={cool} opacity={0.34} phase={5.5} />}
        </>
      )}
    </group>
  );
}
