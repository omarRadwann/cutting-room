"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, useTexture, useVideoTexture } from "@react-three/drei";
import * as THREE from "three";
import { withBase } from "@/lib/withBase";
import { postersOnly } from "@/lib/force";
import { scroll } from "@/lib/scroll-store";
import { prefersReducedMotion } from "@/lib/reduced-motion";
import { pointerNorm } from "@/lib/drum-state";
import { focusVideo } from "@/lib/focus-video";
import { RADIUS, PANEL_H } from "@/lib/drum-config";
import type { Clip } from "@/lib/content";

const damp = THREE.MathUtils.damp;
const clamp = THREE.MathUtils.clamp;
const FLOOR_Y = -PANEL_H / 2 - 0.14;

// aspect-keyed velvet-mat textures with a thin GOLD inner rule — the jewelry line around every print.
// Uniform world thickness via per-axis pixel widths; only two aspect families exist (16:9, 9:16).
const _matTex = new Map<string, THREE.CanvasTexture>();
function matTex(w: number, h: number): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const key = w > h ? "w" : "t";
  const hit = _matTex.get(key); if (hit) return hit;
  const CW = 512, CH = Math.round((512 * (h + 0.08)) / (w + 0.08));
  const c = document.createElement("canvas"); c.width = CW; c.height = CH;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#131017"; ctx.fillRect(0, 0, CW, CH); // the velvet
  const inX = (0.026 / (w + 0.08)) * CW, inY = (0.026 / (h + 0.08)) * CH;   // rule inset from mat edge
  const txX = Math.max(1.4, (0.007 / (w + 0.08)) * CW), txY = Math.max(1.4, (0.007 / (h + 0.08)) * CH);
  ctx.fillStyle = "#b98b3f"; // burnished gold, matte (env does the glinting)
  ctx.fillRect(inX, inY, CW - inX * 2, txY);
  ctx.fillRect(inX, CH - inY - txY, CW - inX * 2, txY);
  ctx.fillRect(inX, inY, txX, CH - inY * 2);
  ctx.fillRect(CW - inX - txX, inY, txX, CH - inY * 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  _matTex.set(key, t); return t;
}

// one shared soft radial (dark centre → transparent) for every panel's floor contact-shadow
let _shadowTex: THREE.CanvasTexture | null = null;
function shadowTex(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  if (_shadowTex) return _shadowTex;
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(0,0,0,0.82)"); g.addColorStop(0.5, "rgba(0,0,0,0.32)"); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  _shadowTex = new THREE.CanvasTexture(c); return _shadowTex;
}

/** Video layer — mounted while a panel is active. `playing=false` = PRE-BUFFER mode: the element loads
 *  and uploads its first frame but stays PAUSED (no decode stream), so the hero beat pays nothing and the
 *  first scroll into the reel starts the film instantly. */
function ActiveVideo({ src, unmuted, playing, expose, w, h }: { src: string; unmuted: boolean; playing: boolean; expose: boolean; w: number; h: number }) {
  const tex = useVideoTexture(src, { muted: true, loop: true, start: false, crossOrigin: "anonymous", playsInline: true, preload: "auto" });
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const v = tex.image as HTMLVideoElement;
  useEffect(() => {
    if (!v) return;
    v.muted = !unmuted;
    if (playing) v.play?.().catch(() => {});
    else v.pause?.();
  }, [v, playing, unmuted]);
  useEffect(() => {
    if (!v || !expose) return;
    focusVideo.el = v; // the overlay's timecode scrubline reads this
    return () => { if (focusVideo.el === v) focusVideo.el = null; };
  }, [v, expose]);
  useFrame((_, dt) => { if (mat.current) mat.current.opacity = damp(mat.current.opacity, playing ? 1 : 0, 7, dt); });
  return (
    // a LIT screen: the video drives both albedo (so it catches the room's soft specular) AND emissive
    // (self-glow), kept toneMapped so it lives in the room's AgX response — not a flat unlit sticker
    <mesh position={[0, 0, 0.02]} raycast={() => null}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial ref={mat} map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.92}
        roughness={0.5} metalness={0} transparent opacity={0} />
    </mesh>
  );
}

export default function VideoPanel({
  clip, index, angle, width, height, active, focused, unmuted, intro, onSelect, wasDragging,
}: {
  clip: Clip; index: number; angle: number; width: number; height: number;
  active: boolean; focused: boolean; unmuted: boolean; intro: boolean;
  onSelect: (i: number) => void; wasDragging: () => boolean;
}) {
  const grp = useRef<THREE.Group>(null);
  const posterMat = useRef<THREE.MeshStandardMaterial>(null);
  const shadowMat = useRef<THREE.MeshBasicMaterial>(null);
  const hov = useRef(false);
  const poster = useTexture(withBase(clip.poster));
  poster.colorSpace = THREE.SRGBColorSpace;
  const shadow = useMemo(() => shadowTex(), []);
  const reduce = useMemo(() => prefersReducedMotion(), []);
  const prevActive = useRef(false);
  const ignite = useRef(0);
  const tiltX = useRef(0);
  const tiltY = useRef(0);
  const w = width, h = height;

  // the CHANGEOVER DISSOLVE: when this film loses the front, its video LINGERS paused for 750ms and
  // fades out over the poster while the new front's video fades in — a true projection crossfade.
  const [linger, setLinger] = useState(false);
  const lingerT = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (active) {
      setLinger(true);
      if (lingerT.current) { clearTimeout(lingerT.current); lingerT.current = null; }
    } else {
      lingerT.current = setTimeout(() => setLinger(false), 750);
    }
    return () => { if (lingerT.current) clearTimeout(lingerT.current); };
  }, [active]);

  useFrame((_, dt) => {
    const lit = active || hov.current;
    // projector CHANGEOVER — a brief hot flash the instant a film takes the front (the reel switches)
    if (active && !prevActive.current && !reduce) ignite.current = 1;
    prevActive.current = active;
    ignite.current = Math.max(0, ignite.current - dt * 2.4);
    if (grp.current) {
      // hero hierarchy — the featured film SEIZES the frame; neighbours defer (breaks the "xeroxed tiles" look)
      const s = focused ? 1.15 : active ? 1.16 : hov.current ? 1.0 : 0.89;
      grp.current.scale.setScalar(damp(grp.current.scale.x, s, 7, dt));
      // the reel ASSEMBLES as the curtain lifts — each film rises into place, staggered around the drum
      const birth = reduce ? 1 : clamp((scroll.progress - 0.018 - index * 0.006) / 0.05, 0, 1);
      const eb = 1 - Math.pow(1 - birth, 3);
      grp.current.position.y = (eb - 1) * 0.95;
      // the featured film subtly faces the visitor (≤1.3°; pointerNorm stays 0 on touch/reduced-motion)
      const tilt = active && !focused ? 1 : 0;
      tiltX.current = damp(tiltX.current, tilt * pointerNorm.y * 0.016, 4, dt);
      tiltY.current = damp(tiltY.current, tilt * pointerNorm.x * 0.022, 4, dt);
      grp.current.rotation.x = (1 - eb) * -0.14 + tiltX.current;
      grp.current.rotation.y = angle + tiltY.current;
    }
    if (posterMat.current) {
      // dim non-featured films via self-glow; the changeover flash rides on top and decays
      const flash = ignite.current * ignite.current * 0.85;
      posterMat.current.emissiveIntensity = damp(posterMat.current.emissiveIntensity, (lit ? 0.95 : 0.27) + flash, 6, dt);
    }
    if (shadowMat.current) {
      // the featured film presses a deeper contact shadow into the floor; neighbours sit lighter
      shadowMat.current.opacity = damp(shadowMat.current.opacity, lit ? 0.52 : 0.3, 6, dt);
    }
  });

  return (
    <group ref={grp} position={[Math.sin(angle) * RADIUS, 0, Math.cos(angle) * RADIUS]} rotation={[0, angle, 0]}>
      {/* soft contact shadow grounding the film on the studio floor (deepens under the featured film) */}
      {shadow && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.012, 0.2]}>
          {/* wider + deeper: detaches the frame from its floor reflection so the film never reads
              as spilling past its bottom rail */}
          <planeGeometry args={[w + 0.9, 1.9]} />
          <meshBasicMaterial ref={shadowMat} map={shadow} transparent opacity={0.3} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      {/* framed screen — a real beveled box with depth, catching the key + rim light (dimensional, not flat) */}
      <mesh position={[0, 0, -0.085]} castShadow>
        <boxGeometry args={[w + 0.17, h + 0.17, 0.15]} />
        <meshStandardMaterial color="#17171d" roughness={0.28} metalness={0.9} envMapIntensity={1.3} />
      </mesh>
      {/* velvet mat — the passe-partout between frame and print, with a thin burnished-gold inner rule */}
      <mesh position={[0, 0, 0.002]} raycast={() => null}>
        <planeGeometry args={[w + 0.08, h + 0.08]} />
        <meshPhysicalMaterial map={matTex(w, h) ?? undefined} color="#ffffff" roughness={0.92} metalness={0.15} sheen={1} sheenColor="#3a2f4f" sheenRoughness={0.5} envMapIntensity={1.1} />
      </mesh>
      {/* museum placard — engraved plate under the piece: "01 — THE COAST" */}
      <group position={[0, -h / 2 - 0.2, 0.05]}>
        <mesh raycast={() => null}>
          <boxGeometry args={[Math.min(w * 0.78, 1.62), 0.15, 0.02]} />
          <meshStandardMaterial color="#101318" metalness={0.85} roughness={0.35} envMapIntensity={1.4} />
        </mesh>
        <Text position={[0, 0, 0.013]} fontSize={0.056} letterSpacing={0.16} color="#d6cfc0" anchorX="center" anchorY="middle" raycast={() => null}>
          {`${String(index + 1).padStart(2, "0")} — ${clip.title.toUpperCase()}`}
        </Text>
      </group>
      {/* poster (always) — sits just proud of the frame face */}
      <mesh
        position={[0, 0, 0.012]}
        onClick={(e) => { e.stopPropagation(); if (!wasDragging()) onSelect(index); }}
        onPointerOver={() => { hov.current = true; document.documentElement.dataset.hovering = "1"; }}
        onPointerOut={() => { hov.current = false; document.documentElement.dataset.hovering = "0"; }}
      >
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial ref={posterMat} map={poster} emissiveMap={poster} emissive="#ffffff" emissiveIntensity={0.5} roughness={0.55} metalness={0} />
      </mesh>
      {/* front film mounts immediately but PLAYS only while it holds the front — and LINGERS fading
          for 750ms when it loses it (the dissolve). Paused lingering video costs no decode. */}
      {(active || linger) && !postersOnly() && (
        <Suspense fallback={null}>
          <ActiveVideo src={withBase(clip.src)} unmuted={unmuted} playing={!intro && active} expose={focused} w={w} h={h} />
        </Suspense>
      )}
      {/* fresnel glass cover — reflects the softbox rig so each film reads as a framed piece behind glass;
          no transmission AND no clearcoat (the envMap reflection + fresnel do the work) → cheap on the iGPU */}
      <mesh position={[0, 0, 0.034]} raycast={() => null}>
        <planeGeometry args={[w, h]} />
        <meshPhysicalMaterial transparent opacity={0.08} roughness={0.09} metalness={0} ior={1.45} reflectivity={0.62} envMapIntensity={2.0} color="#ffffff" depthWrite={false} />
      </mesh>
    </group>
  );
}

const _c = new THREE.Color();
