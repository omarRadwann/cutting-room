"use client";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CLIPS } from "@/lib/content";
import { DRUM, PANELS, N_PANELS } from "@/lib/drum-config";
import { scroll } from "@/lib/scroll-store";
import { drumState } from "@/lib/drum-state";
import { getForce } from "@/lib/force";
import { getUI, setFront, setFocus, useUI } from "@/lib/ui-store";
import VideoPanel from "@/components/VideoPanel";

const damp = THREE.MathUtils.damp;
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const TWO_PI = Math.PI * 2;
const wrap = (a: number) => (((a % TWO_PI) + TWO_PI + Math.PI) % TWO_PI) - Math.PI; // → [-π, π]
const unwrapNear = (a: number, cur: number) => a + Math.round((cur - a) / TWO_PI) * TWO_PI;

function nearestFront(rot: number) {
  let best = 0, bd = 1e9;
  for (const p of PANELS) { const d = Math.abs(wrap(p.angle + rot)); if (d < bd) { bd = d; best = p.index; } }
  return best;
}

/** Drum of native-aspect film panels. Scroll brings each film to front in turn; drag spins with
 *  inertia and RESTS WHERE LEFT (no forced snap-to-centre); click focuses (the rig dollies in). */
export default function Drum() {
  const group = useRef<THREE.Group>(null);
  const spin = useRef(0);
  const drag = useRef({ active: false, lastX: 0, offset: 0, vel: 0, moved: 0 });
  const ui = useUI();

  useEffect(() => {
    const canvas = document.querySelector("canvas"); if (!canvas) return;
    const down = (e: PointerEvent) => { if (e.button !== 0 || getUI().focus !== null) return; drag.current.active = true; drag.current.lastX = e.clientX; drag.current.moved = 0; drag.current.vel = 0; };
    const move = (e: PointerEvent) => { if (!drag.current.active) return; const dx = e.clientX - drag.current.lastX; drag.current.lastX = e.clientX; drag.current.offset -= dx * 0.005; drag.current.vel = -dx * 0.005; drag.current.moved += Math.abs(dx); };
    const up = () => { drag.current.active = false; };
    canvas.addEventListener("pointerdown", down); window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { canvas.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);

  useFrame((_, dt) => {
    const g = group.current; if (!g) return;
    const forced = getForce(); if (forced != null) scroll.progress = forced;
    const focus = getUI().focus;

    let target: number;
    if (focus !== null) {
      target = unwrapNear(-PANELS[focus].angle, g.rotation.y);
      drag.current.offset *= 0.85;
    } else {
      const t = clamp((scroll.progress - DRUM.browseFrom) / (DRUM.browseTo - DRUM.browseFrom), 0, 1);
      const f = t * (N_PANELS - 1);
      const i0 = Math.floor(f), i1 = Math.min(N_PANELS - 1, i0 + 1), fr = f - i0;
      const baseAngle = lerp(PANELS[i0].angle, PANELS[i1].angle, fr);
      // free inertia: a flick glides to a stop and the drum RESTS THERE — it is never yanked to the
      // nearest film. Scroll positions the reel; drag nudges it and it stays exactly where you leave it.
      if (!drag.current.active) { drag.current.offset += drag.current.vel; drag.current.vel *= 0.9; }
      target = unwrapNear(-baseAngle, g.rotation.y) + drag.current.offset;
    }
    spin.current = target;
    g.rotation.y = damp(g.rotation.y, target, 5, dt);
    const front = nearestFront(g.rotation.y);
    setFront(front);
    // publish the featured film's live world angle so the Room's spotlight follows it, even off-centre
    drumState.rot = g.rotation.y;
    drumState.frontAngle = wrap(PANELS[front].angle + g.rotation.y);
  });

  const wasDragging = () => drag.current.moved > 6;

  return (
    <group ref={group}>
      {CLIPS.map((clip, i) => (
        <VideoPanel
          key={clip.slug}
          clip={clip}
          index={i}
          angle={PANELS[i].angle}
          width={PANELS[i].width}
          height={PANELS[i].height}
          active={i === ui.front || i === ui.focus}
          focused={i === ui.focus}
          unmuted={i === ui.focus && !ui.muted}
          intro={ui.intro && ui.focus === null}
          onSelect={setFocus}
          wasDragging={wasDragging}
        />
      ))}
    </group>
  );
}
