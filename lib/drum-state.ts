// Module-singleton bridge from the Drum (inside <Canvas>) to the Room's lighting rig.
// Drum writes the featured film's CURRENT world angle every frame; Room damps the
// spotlight/pool group toward it so the light always lands on whatever film the user
// left at front — wherever it rests (free-rest, no forced centering).
export const drumState = {
  rot: 0,            // the drum group's live rotation.y
  frontAngle: 0,     // world angle of the featured (front-most) film, ≈0 at dead-centre
};

// normalised pointer (−1..1, y down) — written by CustomCursor (fine pointers only, so it stays 0 on
// touch/reduced-motion), read by the featured panel's subtle face-the-visitor tilt.
export const pointerNorm = { x: 0, y: 0 };
