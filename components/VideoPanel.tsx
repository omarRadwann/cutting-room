"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, useTexture, useVideoTexture } from "@react-three/drei";
import * as THREE from "three";
import { withBase } from "@/lib/withBase";
import { postersOnly } from "@/lib/force";
import { RADIUS, PANEL_H } from "@/lib/drum-config";
import type { Clip } from "@/lib/content";

const damp = THREE.MathUtils.damp;
const FLOOR_Y = -PANEL_H / 2 - 0.14;

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
function ActiveVideo({ src, unmuted, playing, w, h }: { src: string; unmuted: boolean; playing: boolean; w: number; h: number }) {
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
  const rim = useRef<THREE.MeshBasicMaterial>(null);
  const shadowMat = useRef<THREE.MeshBasicMaterial>(null);
  const hov = useRef(false);
  const poster = useTexture(withBase(clip.poster));
  poster.colorSpace = THREE.SRGBColorSpace;
  const shadow = useMemo(() => shadowTex(), []);
  const w = width, h = height;

  useFrame((_, dt) => {
    const lit = active || hov.current;
    if (grp.current) {
      // hero hierarchy — the featured film SEIZES the frame; neighbours defer (breaks the "xeroxed tiles" look)
      const s = focused ? 1.15 : active ? 1.13 : hov.current ? 1.0 : 0.9;
      grp.current.scale.setScalar(damp(grp.current.scale.x, s, 7, dt));
    }
    if (posterMat.current) {
      // dim non-featured films by dropping the screen's self-glow, not by greying the albedo
      posterMat.current.emissiveIntensity = damp(posterMat.current.emissiveIntensity, lit ? 0.85 : 0.32, 6, dt);
    }
    if (rim.current) {
      // a grade-tinted rim glows on the active/hovered film
      _c.set(clip.grade);
      rim.current.color.lerp(_c, 1 - Math.exp(-4 * dt));
      rim.current.opacity = damp(rim.current.opacity, active ? 0.5 : hov.current ? 0.35 : 0, 6, dt);
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
          <planeGeometry args={[w + 0.5, 1.3]} />
          <meshBasicMaterial ref={shadowMat} map={shadow} transparent opacity={0.3} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      {/* soft grade rim behind the frame (separation glow) */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[w + 0.34, h + 0.34]} />
        <meshBasicMaterial ref={rim} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* framed screen — a real beveled box with depth, catching the key + rim light (dimensional, not flat) */}
      <mesh position={[0, 0, -0.085]} castShadow>
        <boxGeometry args={[w + 0.17, h + 0.17, 0.15]} />
        <meshStandardMaterial color="#17171d" roughness={0.28} metalness={0.9} envMapIntensity={1.3} />
      </mesh>
      {/* velvet mat — the passe-partout between frame and print (museum matting; sheen = the fabric cue) */}
      <mesh position={[0, 0, 0.002]} raycast={() => null}>
        <planeGeometry args={[w + 0.08, h + 0.08]} />
        <meshPhysicalMaterial color="#131017" roughness={0.95} metalness={0} sheen={1} sheenColor="#3a2f4f" sheenRoughness={0.5} />
      </mesh>
      {/* museum placard — engraved plate under the piece: "01 — THE COAST" */}
      <group position={[0, -h / 2 - 0.19, 0.05]}>
        <mesh raycast={() => null}>
          <boxGeometry args={[Math.min(w * 0.72, 1.5), 0.13, 0.02]} />
          <meshStandardMaterial color="#101318" metalness={0.85} roughness={0.35} envMapIntensity={1.4} />
        </mesh>
        <Text position={[0, 0, 0.013]} fontSize={0.045} letterSpacing={0.18} color="#cfc8ba" anchorX="center" anchorY="middle" raycast={() => null}>
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
      {/* front film mounts immediately but PLAYS only once the hero uncovers it — pre-buffered, zero
          decode competition during the hero beat, instant start on the first scroll */}
      {active && !postersOnly() && (
        <Suspense fallback={null}>
          <ActiveVideo src={withBase(clip.src)} unmuted={unmuted} playing={!intro} w={w} h={h} />
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
