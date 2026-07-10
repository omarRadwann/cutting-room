// Plain module singleton so R3F components (inside <Canvas>) can read scroll state
// WITHOUT React-context bridging across the renderer boundary.
// SmoothScroll updates this on every Lenis tick; ScrollCameraRig / shaders read it in useFrame.
export const scroll = {
  progress: 0, // 0..1 of total scrollable height
  velocity: 0, // signed px/frame-ish; use Math.abs() for blur/displacement amounts
};
