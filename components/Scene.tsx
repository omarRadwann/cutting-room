"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, type ReactElement } from "react";
import * as THREE from "three";
import { PerformanceMonitor, Preload, Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, SMAA, N8AO, DepthOfField, ChromaticAberration, Noise, HueSaturation } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import Drum from "@/components/Drum";
import Room from "@/components/Room";
import CinematicRig from "@/components/CinematicRig";
import PerfReporter from "@/components/PerfReporter";
import { DRUM } from "@/lib/drum-config";
import { dprCap } from "@/lib/force";
import { useQuality, demoteTier, tierForced } from "@/lib/quality";

/** STANDARD/SAFE scale DPR with FPS; HIGH is pinned to its cap (via the Canvas dpr prop) so a capable GPU
 *  renders at full crispness instead of the ramp stalling ~12% low. If a HIGH machine can't cope, onFallback
 *  demotes the whole tier. Floor stays 1.0 — never sub-native. (references/production-hardening.md §B) */
function AdaptiveQuality({ tier, min, max }: { tier: string; min: number; max: number }) {
  const setDpr = useThree((s) => s.setDpr);
  return (
    <PerformanceMonitor
      bounds={() => [55, 75]}
      flipflops={6} /* demote on SUSTAINED low FPS only — a transient scroll dip must not trigger a tier change */
      onChange={({ factor }) => { if (tier === "high") return; setDpr(Math.round((min + (max - min) * factor) * 100) / 100); }}
      onFallback={() => { setDpr(min); if (!tierForced()) demoteTier(); }}
    />
  );
}

/** Compile all materials + upload assets up-front so the first time a later scene appears there's no
 *  mid-scroll upload/compile hitch. Add `gl.initTexture(tex)` for hero textures you load. (§A) */
function PreWarm() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => { try { gl.compile(scene, camera); } catch { /* ignore */ } }, [gl, scene, camera]);
  return null;
}

/**
 * The fixed full-viewport WebGL layer — hardened from frame one.
 *  • adaptive 3-tier quality (HIGH pinned to DPR cap, STANDARD/SAFE adaptive, floor 1.0)
 *  • NO Canvas key on tier — every tier setting (dpr / post-FX set / particles / env size) updates IN PLACE, so
 *    an adaptive demote is SEAMLESS. A key={tier} remounts the whole WebGL context (re-parse GLTF, recompile all
 *    shaders, re-bake env) → a multi-second BLACK screen mid-scroll. NEVER key the Canvas on tier. (footguns.md #1)
 *  • PerfReporter + (mount <DebugOverlay/> in page.tsx, open with ?debug=1) for honest perf numbers
 *  • PreWarm so transitions don't hitch on first-use uploads
 *  • bloom threshold 0.9 (won't halo a bright/white hero), DOF bokehScale 0 at rest (hero stays sharp)
 *  • ⚠ Bloom + a TRANSPARENT/x-ray scene can blacken the WHOLE frame (a NaN spread by mipmapBlur). If you fade
 *    the model to glass / reveal internals, read post-and-perf-safety.md §A before trusting Bloom.
 */
export default function Scene() {
  const q = useQuality();

  const effects = [
    q.ao ? <N8AO key="ao" aoRadius={1.2} intensity={2} distanceFalloff={1} halfRes /> : null,
    // DOF: keep bokehScale ~0 at rest; drive it from your transition/scroll value so the hero is razor-sharp
    // at every dwell (an always-on bokeh softens the subject — a top cause of "looks low quality"). (§C)
    q.dof ? <DepthOfField key="dof" focusDistance={0.02} focalLength={0.03} bokehScale={0} /> : null,
    // Bloom threshold 0.9 → accents specular/emissive highlights, NOT a bright/white hero label
    // (a low threshold blooms white print and reads as soft). (§C)
    q.bloom ? <Bloom key="bloom" mipmapBlur intensity={q.bloomIntensity} luminanceThreshold={0.9} luminanceSmoothing={0.2} /> : null,
    q.ca ? <ChromaticAberration key="ca" blendFunction={BlendFunction.NORMAL} offset={new THREE.Vector2(0.0004, 0.0004)} /> : null,
    q.grain ? <Noise key="noise" premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.03} /> : null,
    // pull saturation down a touch — the single cheapest "restrained maison" move (research thread 2)
    <HueSaturation key="hs" saturation={-0.08} />,
    <Vignette key="vig" darkness={0.55} offset={0.28} />,
    <SMAA key="smaa" />,
  ].filter(Boolean) as ReactElement[];

  return (
    <Canvas
      shadows="soft"
      dpr={dprCap() ? ([1, dprCap()!] as [number, number]) : q.tier === "high" ? q.dprMax : [1, q.dprMax]}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
      camera={{ position: [0, 0, DRUM.radius + 3.6], fov: DRUM.fov }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.AgXToneMapping; // r160+ filmic rolloff — de-washes highlights, holds hue (research thread 1)
        gl.toneMappingExposure = 1.08;         // light at the source, let AgX pull it down
        gl.outputColorSpace = THREE.SRGBColorSpace;
        // keep a lost context recoverable (driver reset / memory pressure) instead of going black forever
        gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
      }}
    >
      <AdaptiveQuality tier={q.tier} min={q.dprMin} max={q.dprMax} />
      <PerfReporter />
      {/* dark cinema void; fog dissolves the back of the drum into black (scaled to the drum radius) */}
      <color attach="background" args={["#06080c"]} />
      <fog attach="fog" args={["#06080c", DRUM.browseDist * 0.85, DRUM.browseDist + DRUM.radius * 2.3]} />
      {/* cool ambient fill = a cold soundstage; the warm emissive films are the only heat in the room */}
      <ambientLight intensity={0.2} color="#9fb4c8" />
      {/* key light — REAL cast shadows on standard+high (512 map on standard: the double-decode fix bought
          the headroom back; frames throw long soft shadows across the floor = the "lit set" tell) */}
      <directionalLight
        castShadow={q.tier !== "safe"}
        position={[2.5, 9, DRUM.radius + 7]}
        intensity={q.tier === "safe" ? 0.5 : 1.6}
        color="#fff1da"
        shadow-mapSize={q.tier === "high" ? [1024, 1024] : [512, 512]}
        shadow-camera-near={1}
        shadow-camera-far={44}
        shadow-camera-left={-13}
        shadow-camera-right={13}
        shadow-camera-top={13}
        shadow-camera-bottom={-13}
        shadow-bias={-0.0005}
      />
      {/* fill — cool bounce from camera-left, softens the key's shadow side */}
      <pointLight position={[-6, 2.5, DRUM.radius + 2]} intensity={7} color="#6f9fc4" distance={34} />
      {/* back-rim — grazes the metallic frames from behind-left so they separate from the cove (rim only, no shadow) */}
      <directionalLight position={[-5, 7, -DRUM.radius * 0.5]} intensity={q.tier === "safe" ? 0.55 : 1.15} color="#a6c8e6" />
      {/* studio env — softbox reflections on the panel frames + floor (Lightformer rig, no external HDRI) */}
      {q.tier !== "safe" && (
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={2.5} position={[0, 6, -6]} scale={[13, 6, 1]} color="#eaf0f6" />
          <Lightformer intensity={1.2} position={[-7, 2, 4]} scale={[3, 9, 1]} color="#6f9fc4" />
          <Lightformer intensity={1.2} position={[7, 2, 4]} scale={[3, 9, 1]} color="#d8a24a" />
          <Lightformer intensity={1.4} position={[0, -3, 5]} scale={[10, 2, 1]} color="#b9946a" />
          {/* thin high strip ~30° above front — the museum picture-light: ONE controlled streak across each glass cover */}
          <Lightformer intensity={2.0} position={[0, 5, 7]} rotation={[-0.5, 0, 0]} scale={[14, 0.5, 1]} color="#f2f7ff" />
        </Environment>
      )}

      <Suspense fallback={null}>
        <PreWarm />
        <Drum />
        <Room />
        <Preload all />
      </Suspense>

      <CinematicRig />

      {/* stencilBuffer off — sharing it across depth-reading passes (N8AO + DOF) triggers the ANGLE
          depth-stencil blit error → black frame. */}
      <EffectComposer multisampling={0} stencilBuffer={false}>
        {effects}
      </EffectComposer>
    </Canvas>
  );
}
