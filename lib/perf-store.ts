// Live perf telemetry — written by <PerfReporter/> (inside the Canvas) each frame, read by <DebugOverlay/>
// (DOM) and any profiler. Plain singleton so canvas + DOM share it without React context.
export const perf = {
  fps1: 0,       // rolling FPS over ~1s
  fps10: 0,      // rolling FPS over ~10s
  dpr: 0,        // TRUE backbuffer DPR (not getPixelRatio, which reads stale under a composer)
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  programs: 0,
  gpu: "?",
  webgl2: false,
};
