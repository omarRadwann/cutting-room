"use client";

/**
 * audioEngine.ts — music-on-scroll + audio-reactive engine. Module singleton (`audioEngine`).
 *
 * THE ONE HARD-WON TRICK (read this before changing anything about the bed):
 *   Browsers BLOCK Web Audio's AudioContext until a real user GESTURE — and a wheel/scroll does NOT
 *   count as a gesture in Chrome. So an immersive scroll site cannot start music on first scroll via
 *   Web Audio. The workaround: the ambient music BED is a STANDALONE <audio> element (NOT routed
 *   through the AudioContext). A MUTED <audio> is allowed to autoplay with no gesture; then UNMUTING
 *   an already-playing element IS honored on a wheel/scroll/click. That is the ONLY reliable way to
 *   get "music plays as soon as the user scrolls." The velocity "wind" and one-shot cues still use
 *   Web Audio (they need ctx.resume() on a click, which is fine — they're accents, not the bed).
 *
 * WHAT'S IN HERE
 *   • bed:     standalone muted-autoplay <audio>, unmuted on first wheel/click; volume tracks
 *              setBedActive (only audible while a cinematic section is on screen).
 *   • wind:    scroll-velocity "air" via Web Audio (brown noise → highpass → speed-controlled lowpass).
 *   • cues:    a couple of GENERIC synthesized one-shots ('whoosh', 'chime', 'tick') that DUCK the bed.
 *   • getLevel(): smoothed bass-weighted 0–1 from an AnalyserNode on the master mix — same-frame
 *              cached — for audio-reactive emissives / bloom that pulse with what's actually audible.
 *   • setMuted / setBedActive / reduced-motion respect.
 *
 * SCAFFOLD INTEGRATION (wire by hand):
 *   • Audio URL goes through the scaffold's withBase() — drop your track at
 *     public/audio/ambient.mp3 (or change AMBIENT_BED_PATH). withBase makes it survive a GitHub-Pages
 *     subpath deploy.
 *   • On mount (a top-level "use client" component): `audioEngine.initBed()`.
 *   • Register ONE-TIME unlock listeners: `["wheel","touchstart","click","keydown"].forEach(t =>
 *     window.addEventListener(t, () => audioEngine.unlock(), { once: true, passive: true }))`.
 *     unlock() unmutes the bed AND resumes the Web Audio ctx for the wind/cues.
 *   • Drive the wind from SmoothScroll: in the Lenis scroll handler call
 *     `audioEngine.setMotion(Math.abs(scroll.velocity) * k)` (or from a useFrame using scroll.velocity).
 *   • Toggle the bed per section: `audioEngine.setBedActive(true|false)`.
 *   • Audio-reactive visuals: in useFrame read `audioEngine.getLevel()` and feed it to an emissive
 *     intensity / bloom amount / uniform.
 *   • A mute button calls `audioEngine.setMuted(!audioEngine.muted)`.
 *   • Reduced motion: initBed() and the wind self-disable when prefers-reduced-motion is set, so a
 *     reduced-motion user gets a silent, calm experience by default (they can still unmute manually if
 *     you expose a control and call setMuted(false)).
 *
 * (Adapted from the Okhtein vault audio engine; Okhtein-specific cue synths trimmed to generic ones.)
 */

import { withBase } from "@/lib/withBase";
import { prefersReducedMotion } from "@/lib/reduced-motion";

/** Path to the ambient music bed (royalty-free track you drop in public/audio/). Routed via withBase. */
const AMBIENT_BED_PATH = "/audio/ambient.mp3";

/** Generic one-shot cues. Add your own by extending this union + the switch in playCue(). */
export type CueName = "whoosh" | "chime" | "tick";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bedGain: GainNode | null = null; // Web Audio bed bus — only matters now for cue ducking
  private cueGain: GainNode | null = null; // one-shot cues bus
  private motionGain: GainNode | null = null; // scroll-velocity "air" wind gain
  private motionFilter: BiquadFilterNode | null = null; // wind lowpass (brightens with speed)
  private analyser: AnalyserNode | null = null; // taps the master mix for getLevel()
  private freqData: Uint8Array | null = null;
  private level = 0; // smoothed reactive energy
  private lastLevelT = -1; // last getLevel() compute time (ms) — same-frame cache
  private bedStarted = false; // Web Audio wind graph built?
  private bedActive = false; // is a cinematic section on screen?
  // The ambient MUSIC bed is a STANDALONE <audio> element (see header) — NOT through the AudioContext.
  private bedEl: HTMLAudioElement | null = null;
  private hasInteracted = false;
  muted = false;

  // Restrained levels — ambient, not loud.
  private readonly vol = 0.42; // Web Audio master (wind + cues)
  private readonly bedVol = 0.55; // <audio> bed volume while a section is active

  /** Lazily build the Web Audio graph (wind + cues + analyser). Returns null if unavailable. */
  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === "undefined") return null;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : this.vol;
    master.connect(ctx.destination);
    const bedGain = ctx.createGain();
    bedGain.gain.value = 0;
    bedGain.connect(master);
    const cueGain = ctx.createGain();
    cueGain.gain.value = 0.7; // tasteful accents
    cueGain.connect(master);
    // Analyser taps the master mix (post-gain → silent when muted), so visuals pulse with what's
    // actually audible — primarily the scroll-motion air.
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    master.connect(analyser);
    this.ctx = ctx;
    this.master = master;
    this.bedGain = bedGain;
    this.cueGain = cueGain;
    this.analyser = analyser;
    this.freqData = new Uint8Array(analyser.frequencyBinCount);
    return ctx;
  }

  /** Call on a user GESTURE (wheel/touch/click/key): resume the Web Audio ctx, build the wind graph,
   *  and unmute the standalone bed. Safe to call more than once (only the first does work). */
  unlock(): void {
    this.unmute(); // make the standalone <audio> bed audible (works on wheel/scroll)
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    if (!this.bedStarted) {
      this.startWind(ctx);
      this.bedStarted = true;
    }
  }

  /** Context created (graph exists). */
  get ready(): boolean {
    return this.ctx !== null;
  }

  /** Context created AND resumed (actually producing sound). Lets the UI distinguish "not started"
   *  from "playing" so the first speaker-icon click STARTS sound rather than muting silence. */
  get running(): boolean {
    return this.ctx !== null && this.ctx.state === "running";
  }

  /** True once the ambient MUSIC bed is actually AUDIBLE (created, unmuted, playing). Read the
   *  element's TRUE state (not hasInteracted) — a wheel may flip .muted while the browser keeps it
   *  silent. Use this to stop a "tap for sound" pulse the instant real sound starts. */
  get bedAudible(): boolean {
    return !!this.bedEl && !this.bedEl.muted && !this.bedEl.paused;
  }

  private bedTarget(): number {
    return this.bedActive ? this.bedVol : 0;
  }

  /**
   * Smoothed 0–1 audio energy (bass-weighted) for audio-reactive visuals. Fast attack / slow decay
   * so visuals pulse with the beat, not jitter. Reads 0 when muted/silent (analyser is post-gain).
   * SAME-FRAME CACHED: multiple consumers (scene + a hero mesh) can call this every frame and the FFT
   * read runs ONCE per frame (a 4ms guard is well under one frame even at 200fps).
   */
  getLevel(): number {
    const a = this.analyser;
    const data = this.freqData;
    if (!a || !data) return 0;
    const now = typeof performance !== "undefined" ? performance.now() : 0;
    if (now - this.lastLevelT < 4) return this.level;
    this.lastLevelT = now;
    a.getByteFrequencyData(data as Uint8Array<ArrayBuffer>);
    let sum = 0;
    const n = 16; // low / low-mid bins carry the beat
    for (let i = 1; i <= n; i++) sum += data[i];
    const raw = sum / (n * 255);
    this.level = raw > this.level ? raw : this.level * 0.9 + raw * 0.1;
    return this.level;
  }

  /** Build the scroll-velocity "wind": brown noise → highpass → speed-controlled lowpass → gain
   *  (opened by setMotion). Routed to master so it also feeds the analyser. */
  private startWind(ctx: AudioContext): void {
    if (prefersReducedMotion()) return; // reduced motion → no velocity wind
    const noise = this.brownNoise(ctx, 4);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 180;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 360;
    lp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.value = 0;
    noise.connect(hp);
    hp.connect(lp);
    lp.connect(g);
    g.connect(this.master!);
    noise.start();
    this.motionGain = g;
    this.motionFilter = lp;
  }

  /**
   * Start the bed as a MUTED-autoplay <audio> element (client-only; call on mount). Muted autoplay is
   * allowed without a gesture, and it STREAMS (no ~60–100MB of decoded PCM). unmute() makes it audible
   * on the first interaction. Self-disables on reduced-motion and on small phones (don't fetch a track
   * they'll never hear).
   */
  initBed(): void {
    if (this.bedEl || typeof window === "undefined") return;
    if (prefersReducedMotion()) return; // reduced motion → no ambient music by default
    if (window.matchMedia("(max-width: 640px) and (pointer: coarse)").matches) return;
    try {
      const el = new Audio(withBase(AMBIENT_BED_PATH));
      el.loop = true;
      el.preload = "auto";
      el.muted = true; // muted autoplay → allowed pre-gesture; unmute() flips it
      el.volume = this.bedActive ? this.bedVol : 0;
      void el.play().catch(() => {}); // muted autoplay; unmute() retries if blocked
      this.bedEl = el;
    } catch {
      /* no audio element available */
    }
  }

  /** Make the bed audible — call on the FIRST user interaction (incl. scroll/wheel). Unmuting an
   *  ALREADY-PLAYING element is honored even on a wheel event — this is what delivers music-on-scroll.
   *  No-op if the user has muted. */
  unmute(): void {
    this.hasInteracted = true;
    const el = this.bedEl;
    if (!el) return;
    if (el.paused) void el.play().catch(() => {}); // start (still muted) if autoplay was blocked
    if (!this.muted) el.muted = false;
  }

  /** Raise/lower the ambient bed (only while a cinematic section is on screen). */
  setBedActive(active: boolean): void {
    this.bedActive = active;
    if (this.bedEl) this.bedEl.volume = active ? this.bedVol : 0;
    const ctx = this.ctx;
    if (!ctx || !this.bedGain) return;
    const t = ctx.currentTime;
    this.bedGain.gain.cancelScheduledValues(t);
    this.bedGain.gain.setValueAtTime(this.bedGain.gain.value, t);
    this.bedGain.gain.linearRampToValueAtTime(this.bedTarget(), t + 0.7);
  }

  /**
   * Drive the scroll-motion "air" from per-frame scroll velocity/delta. Silent at rest; louder +
   * brighter the faster you move. setTargetAtTime gives a smooth, click-free follow of jittery input.
   * Pass a non-negative magnitude (e.g. Math.abs(scroll.velocity) scaled to ~0..1).
   */
  setMotion(magnitude: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.motionGain || !this.motionFilter) return;
    const drive = Math.min(1, Math.max(0, magnitude));
    const t = ctx.currentTime;
    this.motionGain.gain.setTargetAtTime(drive * 0.36, t, 0.08); // 0 at rest → silence when still
    this.motionFilter.frequency.setTargetAtTime(360 + drive * 2100, t, 0.08);
  }

  setMuted(m: boolean): void {
    this.muted = m;
    // Standalone bed: muted if the user muted OR hasn't interacted yet (muted-autoplay state).
    if (this.bedEl) this.bedEl.muted = m || !this.hasInteracted;
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(m ? 0 : this.vol, t + 0.25);
  }

  /** Tuck the bed briefly so a cue reads cleanly, then restore. */
  private duck(dur: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.bedGain || !this.bedActive) return;
    const t = ctx.currentTime;
    const g = this.bedGain.gain;
    const base = this.bedTarget();
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(base * 0.5, t + 0.05);
    g.linearRampToValueAtTime(base, t + dur + 0.4);
  }

  /** Play a one-shot cue (ducks the bed). Synthesized placeholders — swap for decoded file buffers
   *  loaded via withBase later; the public API doesn't change. */
  playCue(name: CueName): void {
    const ctx = this.ensure();
    if (!ctx || this.muted || !this.cueGain) return;
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    switch (name) {
      case "chime":
        this.duck(1.6);
        this.bell(ctx, t);
        break;
      case "whoosh":
        this.duck(1.2);
        this.whoosh(ctx, t);
        break;
      case "tick":
        this.tick(ctx, t);
        break;
    }
  }

  // ---- generic cue synths (placeholders) ----------------------------------------------------------

  /** Inharmonic bell — a clean "confirm / arrive" chime. */
  private bell(ctx: AudioContext, t: number): void {
    const partials: Array<[number, number, number]> = [
      [880, 1, 1.6],
      [1320, 0.55, 1.3],
      [1760, 0.4, 1.0],
      [2640, 0.22, 0.7],
      [3520, 0.12, 0.5],
    ];
    for (const [f, amp, dur] of partials) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp * 0.5, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.cueGain!);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
  }

  /** Soft air/door whoosh — filtered noise with a lowpass sweep. */
  private whoosh(ctx: AudioContext, t: number): void {
    const noise = this.brownNoise(ctx, 1.6);
    noise.loop = false;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(180, t);
    bp.frequency.exponentialRampToValueAtTime(900, t + 0.5);
    bp.frequency.exponentialRampToValueAtTime(140, t + 1.3);
    bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    noise.connect(bp);
    bp.connect(g);
    g.connect(this.cueGain!);
    noise.start(t);
    noise.stop(t + 1.4);
  }

  /** Subtle UI/transition tick. */
  private tick(ctx: AudioContext, t: number): void {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = 2100;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(g);
    g.connect(this.cueGain!);
    o.start(t);
    o.stop(t + 0.08);
  }

  /** Brown-noise buffer source (used by the wind + noise-based cues). */
  private brownNoise(ctx: AudioContext, seconds: number): AudioBufferSourceNode {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 2.2;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    return src;
  }
}

// Module singleton — one engine for the whole app.
export const audioEngine = new AudioEngine();
